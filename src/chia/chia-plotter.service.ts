import { Injectable, Logger } from '@nestjs/common';
import { Gauge, Counter } from 'prom-client';
import * as ps_list from 'ps-list';

import { ConfigService } from '../config/config.service';

@Injectable()
export class ChiaPlotterService {
  private logger: Logger = new Logger(ChiaPlotterService.name);

  private chia_plots_in_prog: Gauge<string>;
  private chia_plot_phase: Gauge<string>;

  constructor(private config_service: ConfigService) {
    if (this.config_service.get_bool('PLOTTER_ENABLED')) {
      this.logger.log('Setup plotter metrics');

      this.chia_plots_in_prog = new Gauge({
        name: 'chia_plots_in_prog',
        help: 'How many plots are currently in progress',
      });

      this.chia_plot_phase = new Gauge({
        name: 'chia_plot_phase',
        help: 'Phase of all in-progress plots',
        labelNames: ['id', 'tmp', 'dst'] as ReadonlyArray<string>,
      });
    }
  }

  public async update_metrics(): Promise<void> {
    if (this.config_service.get_bool('PLOTTER_ENABLED')) {
      const plots = (await ps_list({ all: true }))
        .filter(
          proc =>
            proc.cmd?.match(/(python.*chia plots create|\S*chia_plot)/) != null,
        )
        .map(proc => this.extract_(proc.cmd ?? ''));

      this.chia_plots_in_prog.set(plots.length);
    }
  }

  private extract_(cmd: string) {
    let plotter = 'official';
    if (cmd.match(/\S*chia_plot/)) {
      plotter = 'madmax';
    }

    return {
      plotter,
      tmp: cmd.match(/(?:-t|--tmpdir) (\S+)/)?.[1] ?? '',
      dst: cmd.match(/(?:-d|--finaldir) (\S+)/)?.[1] ?? '',
      k: parseInt(cmd.match(/-k (\d+)/)?.[1] ?? '32'),
      buckets: parseInt(cmd.match(/(?:-u|--buckets) (\d+)/)?.[1] ?? '128'),
      threads: parseInt(cmd.match(/(?:-r|--threads) (\d+)/)?.[1] ?? '1'),
    };
  }
}
