import { Module } from '@nestjs/common';

import { ChiaPlotterService } from './chia-plotter.service';

@Module({
  providers: [ChiaPlotterService],
  exports: [ChiaPlotterService],
})
export class ChiaPlotterModule {}
