import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge, Counter } from 'prom-client';
import { map } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import { ChiaBlockChainState } from '../types/chia-blockchain-state';

@Injectable()
export class ChiaWalletService {
  private logger: Logger = new Logger(ChiaWalletService.name);

  private chia_won = new Gauge({
    name: 'chia_won',
    help: 'Approximation of the current netspace in PiB',
  });

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    try {
      this.config_service.get('wallet_cert');
    } catch {
      this.config_service.set(
        'wallet_cert',
        readFileSync(
          this.config_service.get(
            'wallet_cert_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/wallet/private_wallet.crt`,
          ),
        ).toString(),
      );
    }

    try {
      this.config_service.get('wallet_key');
    } catch {
      this.config_service.set(
        'wallet_key',
        readFileSync(
          this.config_service.get(
            'wallet_key_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/wallet/private_wallet.key`,
          ),
        ).toString(),
      );
    }
  }

  public async update_metrics(): Promise<void> {
    return;
    const root_url =
      'https://' +
      this.config_service.get('wallet_host', 'localhost') +
      ':' +
      this.config_service.get('wallet_port', '9256');

    await this.http_service
      .post<ChiaBlockChainState>(
        `${root_url}/get_blockchain_state`,
        {},
        {
          httpsAgent: new Agent({
            cert: this.config_service.get('wallet_cert'),
            key: this.config_service.get('wallet_key'),
            rejectUnauthorized: false,
          }),
        },
      )
      .pipe(
        map(res => {
          if (!res.data.success) {
            throw new Error(`Couldn't retrieve ${res.request.path}`);
          } else {
            return res.data.blockchain_state;
          }
        }),
      )
      .toPromise();
  }
}
