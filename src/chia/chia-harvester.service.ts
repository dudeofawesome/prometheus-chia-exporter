import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge, Counter } from 'prom-client';
import { map } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import { ChiaHarvesterPlots } from '../types/chia-harvester-plots';

@Injectable()
export class ChiaHarvesterService {
  private logger: Logger = new Logger(ChiaHarvesterService.name);
  private https_agent: Agent;

  private chia_harvester_plot_count: Gauge<string>;
  private chia_harvester_local_size: Gauge<string>;

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    if (this.config_service.get_bool('HARVESTER_ENABLED', false)) {
      try {
        this.config_service.get('HARVESTER_CERT');
      } catch {
        this.config_service.set(
          'HARVESTER_CERT',
          readFileSync(
            this.config_service.get(
              'HARVESTER_CERT_PATH',
              `${process.env.HOME}/.chia/mainnet/config/ssl/harvester/private_harvester.crt`,
            ),
          ).toString(),
        );
      }

      try {
        this.config_service.get('HARVESTER_KEY');
      } catch {
        this.config_service.set(
          'HARVESTER_KEY',
          readFileSync(
            this.config_service.get(
              'HARVESTER_KEY_PATH',
              `${process.env.HOME}/.chia/mainnet/config/ssl/harvester/private_harvester.key`,
            ),
          ).toString(),
        );
      }

      this.https_agent = new Agent({
        cert: this.config_service.get('HARVESTER_CERT'),
        key: this.config_service.get('HARVESTER_KEY'),
        rejectUnauthorized: false,
      });

      this.logger.log('Setup harvester metrics');

      this.chia_harvester_plot_count = new Gauge({
        name: 'chia_harvester_plot_count',
        help: 'Current count of farmed plots',
      });

      this.chia_harvester_local_size = new Gauge({
        name: 'chia_harvester_local_size',
        help: 'Total size of local plots (bytes)',
      });
    }
  }

  public async update_metrics(): Promise<void> {
    if (this.config_service.get_bool('HARVESTER_ENABLED', false)) {
      const root_url =
        'https://' +
        this.config_service.get('HARVESTER_HOST', 'localhost') +
        ':' +
        this.config_service.get('HARVESTER_PORT', '8560');

      await this.http_service
        .post<ChiaHarvesterPlots>(
          `${root_url}/get_plots`,
          {},
          { httpsAgent: this.https_agent },
        )
        .pipe(
          map(res => {
            if (!res.data.success) {
              throw new Error(`Couldn't retrieve ${res.request.path}`);
            } else {
              return res.data;
            }
          }),
        )
        .toPromise()
        .then(data => {
          this.chia_harvester_plot_count.set(data.plots.length);
          this.chia_harvester_local_size.set(
            data.plots.reduce<number>(
              (acc, plot) => (acc += plot.file_size),
              0,
            ),
          );
        });
    }
  }
}
