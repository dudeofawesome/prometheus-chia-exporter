import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge, Counter } from 'prom-client';
import { map, reduce, concatAll } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import {
  ChiaWalletFarmedAmount,
  ChiaWallets,
  ChiaWalletSyncStatus,
  ChiaWalletTransactionCount,
} from '../types/chia-wallet';

@Injectable()
export class ChiaWalletService {
  private logger: Logger = new Logger(ChiaWalletService.name);
  private https_agent: Agent;

  private chia_wallet_synced = new Gauge({
    name: 'chia_wallet_synced',
    help: 'Whether the wallet is currently synced (bool)',
  });

  private chia_wallet_syncing = new Gauge({
    name: 'chia_wallet_syncing',
    help: 'Whether the wallet is currently syncing (bool)',
  });

  private chia_wallet_farmed = new Gauge({
    name: 'chia_wallet_farmed',
    help: 'Total Chia farmed (XCH)',
  });

  private chia_wallets_transactions = new Gauge({
    name: 'chia_wallets_transactions',
    help: 'Total Chia farmed (XCH)',
    labelNames: ['wallet_id'] as ReadonlyArray<string>,
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

    this.https_agent = new Agent({
      cert: this.config_service.get('wallet_cert'),
      key: this.config_service.get('wallet_key'),
      rejectUnauthorized: false,
    });
  }

  public async update_metrics(): Promise<void> {
    const root_url =
      'https://' +
      this.config_service.get('wallet_host', 'localhost') +
      ':' +
      this.config_service.get('wallet_port', '9256');

    await Promise.all([
      this.get_sync_status(root_url),
      this.get_farmed_amount(root_url),
      this.get_transaction_count(root_url),
    ]);
  }

  private get_sync_status(root_url: string): Promise<void> {
    return this.http_service
      .post<ChiaWalletSyncStatus>(
        `${root_url}/get_sync_status`,
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
      .then(sync_status => {
        this.chia_wallet_synced.set(sync_status.synced ? 1 : 0);
        this.chia_wallet_syncing.set(sync_status.syncing ? 1 : 0);
      });
  }

  private get_farmed_amount(root_url: string): Promise<void> {
    return this.http_service
      .post<ChiaWalletFarmedAmount>(
        `${root_url}/get_farmed_amount`,
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
      .then(farmed_amount => {
        this.chia_wallet_farmed.set(farmed_amount.farmed_amount * 1e-12);
      });
  }

  private get_transaction_count(root_url: string): Promise<void> {
    return this.http_service
      .post<ChiaWallets>(
        `${root_url}/get_wallets`,
        {},
        { httpsAgent: this.https_agent },
      )
      .pipe(
        map(res => {
          if (!res.data.success) {
            throw new Error(`Couldn't retrieve ${res.request.path}`);
          } else {
            return res.data.wallets;
          }
        }),
      )
      .pipe(
        map(wallets => {
          return Promise.all(
            wallets.map(wallet =>
              this.http_service
                .post<ChiaWalletTransactionCount>(
                  `${root_url}/get_transaction_count`,
                  { wallet_id: wallet.id },
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
                .pipe(
                  map(wallet_transactions => {
                    this.chia_wallets_transactions.set(
                      { wallet_id: wallet_transactions.wallet_id },
                      wallet_transactions.count,
                    );
                  }),
                )
                .toPromise(),
            ),
          );
        }),
      )
      .pipe(concatAll())
      .toPromise()
      .then();
  }
}
