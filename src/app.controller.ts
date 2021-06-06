import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';

import * as Package from '../package.json';

@Controller()
export class AppController {
  constructor(private health: HealthCheckService) {}

  @Get()
  getHello(): string {
    return (
      Package.name
        .split('-')
        .map(w => `${w.slice(0, 1).toUpperCase()}${w.slice(1)}`)
        .join(' ') + ` - v${Package.version}`
    );
  }

  @Get('/health')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
