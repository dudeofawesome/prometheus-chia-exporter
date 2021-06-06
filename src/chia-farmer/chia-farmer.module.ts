import { Module } from '@nestjs/common';

import { ChiaFarmerService } from './chia-farmer.service';

@Module({
  providers: [ChiaFarmerService],
  exports: [ChiaFarmerService],
})
export class ChiaFarmerModule {}
