import { Module } from '@nestjs/common';

import { ChiaWalletService } from './chia-wallet.service';

@Module({
  providers: [ChiaWalletService],
  exports: [ChiaWalletService],
})
export class ChiaWalletModule {}
