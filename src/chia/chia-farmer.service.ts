import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge, Counter } from 'prom-client';
import { map } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import { ChiaSignagePoints } from '../types/chia-signage-points';

@Injectable()
export class ChiaFarmerService {
  private logger: Logger = new Logger(ChiaFarmerService.name);
  private https_agent: Agent;

  private chia_farmer_signage_point_proofs: Gauge<string>;

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    try {
      this.config_service.get('FARMER_CERT');
    } catch {
      this.config_service.set(
        'FARMER_CERT',
        readFileSync(
          this.config_service.get(
            'FARMER_CERT_PATH',
            `${process.env.HOME}/.chia/mainnet/config/ssl/farmer/private_farmer.crt`,
          ),
        ).toString(),
      );
    }

    try {
      this.config_service.get('FARMER_KEY');
    } catch {
      this.config_service.set(
        'FARMER_KEY',
        readFileSync(
          this.config_service.get(
            'FARMER_KEY_PATH',
            `${process.env.HOME}/.chia/mainnet/config/ssl/farmer/private_farmer.key`,
          ),
        ).toString(),
      );
    }

    this.https_agent = new Agent({
      cert: this.config_service.get('FARMER_CERT'),
      key: this.config_service.get('FARMER_KEY'),
      rejectUnauthorized: false,
    });

    if (this.config_service.get_bool('FARMER_ENABLED')) {
      this.logger.log('Setup farmer metrics');

      this.chia_farmer_signage_point_proofs = new Gauge({
        name: 'chia_farmer_signage_point_proofs',
        help: `Not 100% sure what this is, but maybe it's wins?`,
        labelNames: [
          'challenge_chain',
          'challenge_hash',
        ] as ReadonlyArray<string>,
      });
    }
  }

  public async update_metrics(): Promise<void> {
    if (this.config_service.get_bool('FARMER_ENABLED')) {
      const root_url =
        'https://' +
        this.config_service.get('FARMER_HOST', 'localhost') +
        ':' +
        this.config_service.get('FARMER_PORT', '8559');

      await this.http_service
        .post<ChiaSignagePoints>(
          `${root_url}/get_signage_points`,
          {},
          { httpsAgent: this.https_agent },
        )
        .pipe(
          map(res => {
            if (!res.data.success) {
              throw new Error(`Couldn't retrieve ${res.request.path}`);
            } else {
              return res.data.signage_points;
            }
          }),
        )
        .toPromise()
        .then(signage_points => {
          for (const point of signage_points) {
            this.chia_farmer_signage_point_proofs.set(
              {
                challenge_chain: point.signage_point.challenge_chain_sp,
                challenge_hash: point.signage_point.challenge_hash,
              },
              point.proofs.length,
            );
          }
        });
    }
  }
}
