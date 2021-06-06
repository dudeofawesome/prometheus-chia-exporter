import { Module } from '@nestjs/common';

import { PrometheusService } from './prometheus.service';
import { PrometheusController } from './prometheus.controller';

@Module({
  providers: [PrometheusService],
  controllers: [PrometheusController],
  exports: [PrometheusService],
})
export class PrometheusModule {}
