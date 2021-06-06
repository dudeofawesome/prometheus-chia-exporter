import { Module } from '@nestjs/common';

import { ChiaNetworkService } from './chia-network.service';

@Module({
  providers: [ChiaNetworkService],
  exports: [ChiaNetworkService],
})
export class ChiaNetworkModule {}
