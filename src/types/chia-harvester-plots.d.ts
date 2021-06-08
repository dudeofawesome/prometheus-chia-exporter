export interface ChiaHarvesterPlots {
  failed_to_open_filenames: any[];
  not_found_filenames: any[];
  plots: ChiaHarvesterPlot[];
  success: true;
}

export interface ChiaHarvesterPlot {
  /** size of plot in bytes */
  file_size: number;
  /** absolute path of plot */
  filename: string;
  'plot-seed': string;
  plot_public_key: string;
  pool_contract_puzzle_hash: null;
  pool_public_key: string;
  /** k-value used for plot */
  size: number;
  /** decimal seconds since the epoch */
  time_modified: number;
}
