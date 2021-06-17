import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge } from 'prom-client';
import { map } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import { ChiaBlockChainState } from '../types/chia-blockchain-state';
import { ChiaGetConnections } from '../types/chia-get-connections';

@Injectable()
export class ChiaFullNodeService {
  private logger: Logger = new Logger(ChiaFullNodeService.name);
  private https_agent: Agent;

  private chia_full_node_synced: Gauge<string>;
  private chia_full_node_syncing: Gauge<string>;
  private chia_full_node_connections: Gauge<string>;

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    try {
      this.config_service.get('FULL_NODE_CERT');
    } catch {
      this.config_service.set(
        'FULL_NODE_CERT',
        readFileSync(
          this.config_service.get(
            'FULL_NODE_CERT_PATH',
            `${process.env.HOME}/.chia/mainnet/config/ssl/full_node/private_full_node.crt`,
          ),
        ).toString(),
      );
    }

    try {
      this.config_service.get('FULL_NODE_KEY');
    } catch {
      this.config_service.set(
        'FULL_NODE_KEY',
        readFileSync(
          this.config_service.get(
            'FULL_NODE_KEY_PATH',
            `${process.env.HOME}/.chia/mainnet/config/ssl/full_node/private_full_node.key`,
          ),
        ).toString(),
      );
    }

    this.https_agent = new Agent({
      cert: this.config_service.get('FULL_NODE_CERT'),
      key: this.config_service.get('FULL_NODE_KEY'),
      rejectUnauthorized: false,
    });

    if (this.config_service.get_bool('FULL_NODE_ENABLED')) {
      this.logger.log('Setup full node metrics');

      this.chia_full_node_synced = new Gauge({
        name: 'chia_full_node_synced',
        help: 'Whether or not the full node is synced (bool)',
      });

      this.chia_full_node_syncing = new Gauge({
        name: 'chia_full_node_syncing',
        help: 'Whether or not the full node is syncing (bool)',
      });

      this.chia_full_node_connections = new Gauge({
        name: 'chia_full_node_connections',
        help: 'Current count of connections to the full node',
      });
    }
  }

  public async update_metrics(): Promise<void> {
    if (this.config_service.get_bool('FULL_NODE_ENABLED')) {
      const root_url =
        'https://' +
        this.config_service.get('FULL_NODE_HOST', 'localhost') +
        ':' +
        this.config_service.get('FULL_NODE_PORT', '8555');

      await Promise.all([
        this.http_service
          .post<ChiaBlockChainState>(
            `${root_url}/get_blockchain_state`,
            {},
            { httpsAgent: this.https_agent },
          )
          .pipe(map(res => res.data))
          .pipe(
            map(plots => {
              if (!plots.success) {
                throw new Error(`Couldn't retrieve /get_blockchain_state`);
              } else {
                return plots;
              }
            }),
          )
          .toPromise()
          .then(blockchain_state => {
            this.chia_full_node_synced.set(
              blockchain_state.blockchain_state.sync.synced ? 1 : 0,
            );
            this.chia_full_node_syncing.set(
              blockchain_state.blockchain_state.sync.sync_mode ? 1 : 0,
            );
          }),
        this.http_service
          .post<ChiaGetConnections>(
            `${root_url}/get_connections`,
            {},
            { httpsAgent: this.https_agent },
          )
          .pipe(
            map(res => {
              if (!res.data.success) {
                throw new Error(`Couldn't retrieve ${res.request.path}`);
              } else {
                return res.data.connections;
              }
            }),
          )
          .toPromise()
          .then(connections => {
            this.chia_full_node_connections.set(connections.length);
          }),
      ]);
    }
  }
}
