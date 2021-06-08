import { Injectable, Logger } from '@nestjs/common';
import { Gauge, Counter } from 'prom-client';

import { ConfigService } from '../config/config.service';

@Injectable()
export class ChiaPlotterService {
  private logger: Logger = new Logger(ChiaPlotterService.name);

  private chia_plots_in_prog = new Gauge({
    name: 'chia_plots_in_prog',
    help: 'Phase of all in-progress plots',
  });

  constructor(private config_service: ConfigService) {}

  public async update_metrics(): Promise<void> {
    return;
  }
}
