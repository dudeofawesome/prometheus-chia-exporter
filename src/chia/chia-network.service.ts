import { Injectable, Logger, HttpService } from '@nestjs/common';
import { Agent } from 'https';
import { Gauge, Counter } from 'prom-client';
import { map } from 'rxjs/operators';
import { readFileSync } from 'fs';

import { ConfigService } from '../config/config.service';
import { ChiaBlockChainState } from '../types/chia-blockchain-state';

@Injectable()
export class ChiaNetworkService {
  private logger: Logger = new Logger(ChiaNetworkService.name);
  private https_agent: Agent;

  private chia_network_space = new Gauge({
    name: 'chia_network_space',
    help: 'Approximation of the current netspace (bytes)',
  });

  private chia_network_difficulty = new Gauge({
    name: 'chia_network_difficulty',
    help: "Current network's farming difficulty",
  });

  private chia_network_iterations = new Gauge({
    name: 'chia_network_iterations',
    help: 'Total iterations since the start of the blockchain',
  });

  constructor(
    private http_service: HttpService,
    private config_service: ConfigService,
  ) {
    try {
      this.config_service.get('full_node_cert');
    } catch {
      this.config_service.set(
        'full_node_cert',
        readFileSync(
          this.config_service.get(
            'full_node_cert_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/full_node/private_full_node.crt`,
          ),
        ).toString(),
      );
    }

    try {
      this.config_service.get('full_node_key');
    } catch {
      this.config_service.set(
        'full_node_key',
        readFileSync(
          this.config_service.get(
            'full_node_key_path',
            `${process.env.HOME}/.chia/mainnet/config/ssl/full_node/private_full_node.key`,
          ),
        ).toString(),
      );
    }

    this.https_agent = new Agent({
      cert: this.config_service.get('full_node_cert'),
      key: this.config_service.get('full_node_key'),
      rejectUnauthorized: false,
    });
  }

  public async update_metrics(): Promise<void> {
    const root_url =
      'https://' +
      this.config_service.get('full_node_host', 'localhost') +
      ':' +
      this.config_service.get('full_node_port', '8555');

    await this.http_service
      .post<ChiaBlockChainState>(
        `${root_url}/get_blockchain_state`,
        {},
        { httpsAgent: this.https_agent },
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
      .toPromise()
      .then(blockchain_state => {
        this.chia_network_space.set(blockchain_state.space);
        this.chia_network_difficulty.set(blockchain_state.difficulty);
        this.chia_network_iterations.set(blockchain_state.peak.total_iters);
      });
  }
}
