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

  private chia_harvester_plot_count = new Gauge({
    name: 'chia_harvester_plot_count',
    help: 'Current count of farmed plots',
  });

  private chia_harvester_local_size = new Gauge({
    name: 'chia_harvester_local_size',
    help: 'Total size of local plots (bytes)',
  });

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    try {
      this.config_service.get('harvester_cert');
    } catch {
      this.config_service.set(
        'harvester_cert',
        readFileSync(
          this.config_service.get(
            'harvester_cert_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/harvester/private_harvester.crt`,
          ),
        ).toString(),
      );
    }

    try {
      this.config_service.get('harvester_key');
    } catch {
      this.config_service.set(
        'harvester_key',
        readFileSync(
          this.config_service.get(
            'harvester_key_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/harvester/private_harvester.key`,
          ),
        ).toString(),
      );
    }

    this.https_agent = new Agent({
      cert: this.config_service.get('harvester_cert'),
      key: this.config_service.get('harvester_key'),
      rejectUnauthorized: false,
    });
  }

  public async update_metrics(): Promise<void> {
    const root_url =
      'https://' +
      this.config_service.get('harvester_host', 'localhost') +
      ':' +
      this.config_service.get('harvester_port', '8560');

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
          data.plots.reduce<number>((acc, plot) => (acc += plot.file_size), 0),
        );
      });
  }
}
