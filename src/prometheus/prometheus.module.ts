import { Module } from '@nestjs/common';

import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';
import { ChiaModule } from '../chia/chia.module';

@Module({
  providers: [PrometheusService],
  controllers: [PrometheusController],
  imports: [ChiaModule],
  exports: [PrometheusService],
})
export class PrometheusModule {}
