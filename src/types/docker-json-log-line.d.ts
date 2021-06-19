export interface DockerJSONLogLine {
  log: string;
  stream: 'stdout' | 'stderr';
  /** ISO-8601 datetime */
  time: string;
}
