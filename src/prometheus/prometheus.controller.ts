import {
  Controller,
  Get,
  Logger,
  forwardRef,
  Inject,
  Header,
} from '@nestjs/common';
import { register } from 'prom-client';

import { ChiaFarmerService } from '../chia/chia-farmer.service';
import { ChiaFullNodeService } from '../chia/chia-full-node.service';
import { ChiaHarvesterService } from '../chia/chia-harvester.service';
import { ChiaNetworkService } from '../chia/chia-network.service';
import { ChiaPlotterService } from '../chia/chia-plotter.service';
import { ChiaWalletService } from '../chia/chia-wallet.service';
import { PrometheusService } from './prometheus.service';

@Controller('/metrics')
export class PrometheusController {
  private logger: Logger = new Logger(ChiaFarmerService.name);

  constructor(
    @Inject(forwardRef(() => PrometheusService))
    private readonly prometheus_service: PrometheusService,
    @Inject(forwardRef(() => ChiaFarmerService))
    private readonly chia_farmer_service: ChiaFarmerService,
    @Inject(forwardRef(() => ChiaFullNodeService))
    private readonly chia_full_node_service: ChiaFullNodeService,
    @Inject(forwardRef(() => ChiaHarvesterService))
    private readonly chia_harvester_service: ChiaHarvesterService,
    @Inject(forwardRef(() => ChiaNetworkService))
    private readonly chia_network_service: ChiaNetworkService,
    @Inject(forwardRef(() => ChiaPlotterService))
    private readonly chia_plotter_service: ChiaPlotterService,
    @Inject(forwardRef(() => ChiaWalletService))
    private readonly chia_wallet_service: ChiaWalletService,
  ) {}

  @Get()
  @Header('Content-Type', register.contentType)
  async metrics(): Promise<string> {
    await Promise.all([
      this.chia_farmer_service.update_metrics(),
      this.chia_full_node_service.update_metrics(),
      this.chia_harvester_service.update_metrics(),
      this.chia_network_service.update_metrics(),
      this.chia_plotter_service.update_metrics(),
      this.chia_wallet_service.update_metrics(),
    ]);
    return await register.metrics();
  }
}
