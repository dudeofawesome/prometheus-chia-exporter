import { HttpModule, Module } from '@nestjs/common';

import { ChiaFarmerService } from './chia-farmer.service';
import { ChiaFullNodeService } from './chia-full-node.service';
import { ChiaHarvesterService } from './chia-harvester.service';
import { ChiaNetworkService } from './chia-network.service';
import { ChiaPlotterService } from './chia-plotter.service';
import { ChiaWalletService } from './chia-wallet.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    ChiaFarmerService,
    ChiaFullNodeService,
    ChiaHarvesterService,
    ChiaNetworkService,
    ChiaPlotterService,
    ChiaWalletService,
  ],
  exports: [
    ChiaFarmerService,
    ChiaFullNodeService,
    ChiaHarvesterService,
    ChiaNetworkService,
    ChiaPlotterService,
    ChiaWalletService,
  ],
})
export class ChiaModule {}
