import { Injectable, Logger } from '@nestjs/common';
import { Gauge, Counter } from 'prom-client';
import { exec as execAsync } from 'child_process';
import { readFile, readdir, readlink } from 'fs/promises';
import { relative, join, basename } from 'path';
import { promisify } from 'util';
const exec = promisify(execAsync);
import * as Docker from 'dockerode';

import { ConfigService } from '../config/config.service';
import { DockerJSONLogLine } from 'src/types/docker-json-log-line';

@Injectable()
export class ChiaPlotterService {
  private logger: Logger = new Logger(ChiaPlotterService.name);

  private docker: Docker;

  private chia_plots_in_prog: Gauge<string>;
  private chia_plot_phase: Gauge<string>;

  constructor(private config_service: ConfigService) {
    if (this.config_service.get_bool('PLOTTER_ENABLED')) {
      this.logger.log('Setup plotter metrics');

      this.docker = new Docker({
        socketPath: this.config_service.get(
          'DOCKER_SOCKET',
          '/var/run/docker.sock',
        ),
      });

      this.chia_plots_in_prog = new Gauge({
        name: 'chia_plots_in_prog',
        help: 'How many plots are currently in progress',
      });

      this.chia_plot_phase = new Gauge({
        name: 'chia_plot_phase',
        help: 'Phase of all in-progress plots',
        labelNames: [
          'id',
          'plotter',
          'tmp',
          'dst',
          'k',
        ] as ReadonlyArray<string>,
      });
    }
  }

  public async update_metrics(): Promise<void> {
    if (this.config_service.get_bool('PLOTTER_ENABLED')) {
      const proc_dir = this.config_service.get('PROC_DIR', '/proc');

      const plots = await readdir(proc_dir, { withFileTypes: true }).then(
        async entities => {
          const dirs = entities.filter(
            dir => dir.isDirectory() && dir.name.match(/^[0-9]+$/),
          );

          const dir_proms = (
            await Promise.all(
              dirs.map(dir =>
                readFile(join(proc_dir, dir.name, 'cmdline')).then(buf => ({
                  cmd: buf.toString().replace(/\0/g, ' '),
                  pid: parseInt(dir.name),
                })),
              ),
            )
          ).filter(
            (prom): prom is { cmd: string; pid: number } => prom != null,
          );

          return dir_proms
            .filter(
              dir =>
                dir.cmd.match(/(python.*chia plots create|\S*chia_plot)/) !=
                null,
            )
            .map(proc => this.parse_plot_info(proc));
        },
      );

      this.chia_plots_in_prog.set(plots.length);

      const logged_plots = await Promise.all(
        plots.map(async plot => {
          let extra_info: {
            log_path: string;
            log_contents: string;
            phase: string;
            id: string;
            short_id: string;
          } = {
            log_path: '',
            log_contents: '',
            phase: '',
            id: '',
            short_id: '',
          };

          switch (plot.plotter) {
            case 'official':
              extra_info.log_path = await exec(`lsof -p ${plot.pid}`).then(
                res =>
                  res.stdout
                    .split('\n')
                    .filter(
                      line =>
                        line.indexOf(
                          this.config_service.get('PLOT_LOGS', '/var/log/chia'),
                        ) !== -1,
                    )[0]
                    .split(' ')
                    .slice(-1)[0],
              );
              extra_info.log_contents = await readFile(
                extra_info.log_path,
                'utf-8',
              );
              const log_lines = extra_info.log_contents.split('\n');
              extra_info.id = this.find_official_plot_id(log_lines);
              extra_info.phase = this.find_official_plot_phase(log_lines);
              break;
            case 'madmax':
              const containers = await this.docker
                .listContainers()
                .then(containers =>
                  containers.filter(
                    container => container.Command.indexOf('chia_plot') !== -1,
                  ),
                )
                .then(containers =>
                  Promise.all(
                    containers.map(async container => ({
                      ...container,
                      top: await this.docker.getContainer(container.Id).top(),
                    })),
                  ),
                );

              const pid = plot.pid.toString();
              const container_info = containers.find(
                container => container.top.Processes[0][1] === pid,
              );
              if (container_info != null) {
                extra_info.log_contents = (
                  (await this.docker
                    .getContainer(container_info.Id)
                    .logs({ stdout: true, stderr: true })) as unknown as Buffer
                ).toString();

                const host_tmp = container_info.Mounts.find(
                  mount => relative(mount.Destination, plot.tmp) === '',
                )?.Source;
                if (host_tmp) plot.tmp = host_tmp;

                const host_dst = container_info.Mounts.find(
                  mount => relative(mount.Destination, plot.dst) === '',
                )?.Source;
                if (host_dst) plot.dst = host_dst;

                const split_logs = extra_info.log_contents.split('\n');

                extra_info.id = this.find_madmax_plot_id(split_logs);
                extra_info.phase = this.find_madmax_plot_phase(split_logs);
              } else {
                throw new Error(`Couldn't find container of pid ${plot.pid}`);
              }
              break;
          }

          extra_info.short_id = extra_info.id.slice(0, 8);

          return {
            ...plot,
            ...extra_info,
          };
        }),
      );

      this.chia_plot_phase.reset();
      for (const plot of logged_plots) {
        this.chia_plot_phase.set(
          {
            id: plot.short_id,
            plotter: plot.plotter,
            tmp: plot.tmp,
            dst: plot.dst,
            k: plot.k,
          },
          this.phase_str_to_float(plot.phase),
        );
      }
    }
  }

  private parse_plot_info(proc: { cmd: string; pid: number }) {
    let plotter: 'official' | 'madmax' = 'official';
    if (proc.cmd.match(/\S*chia_plot/)) {
      plotter = 'madmax';
    }

    return {
      ...proc,
      plotter,
      tmp: proc.cmd.match(/(?:-t|--tmpdir) (\S+)/)?.[1] ?? '',
      dst: proc.cmd.match(/(?:-d|--finaldir) (\S+)/)?.[1] ?? '',
      k: parseInt(proc.cmd.match(/-k (\d+)/)?.[1] ?? '32'),
      buckets: parseInt(proc.cmd.match(/(?:-u|--buckets) (\d+)/)?.[1] ?? '128'),
      threads: parseInt(proc.cmd.match(/(?:-r|--threads) (\d+)/)?.[1] ?? '1'),
    };
  }

  private find_official_plot_id(log_lines: ReadonlyArray<string>): string {
    return log_lines.find(line => line.startsWith('ID: '))?.slice(4) || '';
  }

  private find_official_plot_phase(log_lines: ReadonlyArray<string>): string {
    let major_phase_line = 0;
    let major_phase: 1 | 2 | 3 | 4 = 1;
    let minor_phase = 1;

    // find major phase by searching backwards for 'Starting phase X/4'
    for (let i = log_lines.length - 1; i >= 0; i--) {
      if (log_lines[i].startsWith('Starting phase ')) {
        const phase_match = log_lines[i].match(/Starting phase (\d)\/4/);
        if (phase_match != null) {
          major_phase_line = i;
          major_phase = parseInt(phase_match[1]) as 1 | 2 | 3 | 4;
          break;
        }
      }
    }

    // find minor phase
    const major_phase_lines = log_lines.slice(major_phase_line);

    if (major_phase < 4) {
      // handle phases 1 - 3
      let search_string: string;
      let search_regex: RegExp;
      switch (major_phase) {
        case 1:
          search_string = 'Computing table';
          search_regex = /Computing table (\d+)/;
          break;
        case 2:
          search_string = 'Backpropagating on table';
          search_regex = /Backpropagating on table (\d+)/;
          break;
        case 3:
          search_string = 'Compressing tables';
          search_regex = /Compressing tables (\d+)/;
          break;
        default:
          throw new Error(
            `Unknown major phase: ${major_phase}. We shouldn't ever get here`,
          );
      }
      for (let i = major_phase_lines.length - 1; i >= 0; i--) {
        if (major_phase_lines[i].startsWith(search_string)) {
          const phase_match = major_phase_lines[i].match(search_regex);
          if (phase_match != null) {
            switch (major_phase) {
              case 1:
              case 3:
                minor_phase = parseInt(phase_match[1]);
                break;
              case 2:
                minor_phase = 8 - parseInt(phase_match[1]);
                break;
            }
            break;
          }
        }
      }
    } else {
      // handle phase 4
      minor_phase = 1;
      if (major_phase_lines.includes('\tFinished writing C1 and C3 tables')) {
        minor_phase = 2;
      }
    }

    return `${major_phase}:${minor_phase}`;
  }

  private find_madmax_plot_id(log_lines: ReadonlyArray<string>): string {
    // const line = log_lines.find(line => line.includes('Plot Name:'));
    let line: string | void;
    for (let i = log_lines.length - 1; i >= 0; i--) {
      if (log_lines[i].includes('Plot Name:')) {
        line = log_lines[i];
        break;
      }
    }

    const match = line?.match(
      /Plot Name: plot-k\d+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-([0-9a-f]+)/,
    );

    if (match != null) {
      return match[1];
    } else {
      return '';
    }
  }

  private find_madmax_plot_phase(log_lines: string[]): string {
    let major_phase_line = 0;
    let major_phase = 1;
    let minor_phase = 1;

    // find major phase by searching backwards for 'Starting phase X/4'
    for (let i = log_lines.length - 1; i >= 0; i--) {
      if (log_lines[i].includes('Plot Name:')) {
        major_phase_line = i;
        major_phase = 1;
        break;
      } else {
        const phase_match = log_lines[i].match(/Phase (\d) took/);
        if (phase_match != null) {
          // Look for phase end summary
          if (phase_match != null) {
            // add 1 because that's the end of the last phase
            major_phase_line = i + 1;
            // add 1 because we're actually on the next phase
            major_phase = parseInt(phase_match[1]) + 1;
            // cap at 4 since we could check in as the final plot summary is
            // being written
            if (major_phase > 4) major_phase = 4;
            break;
          }
        }
      }
    }

    // find minor phase
    const major_phase_lines = log_lines.slice(major_phase_line);

    if (major_phase < 4) {
      // handle phases 1 - 3
      let search_regex: RegExp;
      switch (major_phase) {
        case 1:
          search_regex = /\[P1\] Table (\d+)/;
          break;
        case 2:
          search_regex = /\[P2\] Table (\d+) scan/;
          break;
        case 3:
          search_regex = /\[P3-1\] Table (\d+) took/;
          break;
        default:
          throw new Error(
            `Unknown major phase: ${major_phase}. We shouldn't ever get here`,
          );
      }
      for (let i = major_phase_lines.length - 1; i >= 0; i--) {
        const phase_match = major_phase_lines[i].match(search_regex);
        if (phase_match != null) {
          switch (major_phase) {
            case 1:
              minor_phase = parseInt(phase_match[1]) + 1;
              break;
            case 2:
              minor_phase = 8 - parseInt(phase_match[1]);
              break;
            case 3:
              minor_phase = parseInt(phase_match[1]) - 1;
              break;
          }
          break;
        }
      }
    } else {
      // handle phase 4
      minor_phase = 1;
      if (major_phase_lines.includes('[P4] Writing C2 table')) {
        minor_phase = 2;
      }
    }

    return `${major_phase}:${minor_phase}`;
  }

  private phase_str_to_float(phase: string): number {
    const split = phase.split(':');
    return parseInt(split[0]) + parseInt(split[1]) / 10;
  }
}
