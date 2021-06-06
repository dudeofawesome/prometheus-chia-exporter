import {
  Controller,
  Get,
  Logger,
  forwardRef,
  Inject,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';

import { PrometheusService } from './prometheus.service';

@Controller()
export class PrometheusController {
  constructor(
    @Inject(forwardRef(() => PrometheusService))
    private readonly typeform_service: PrometheusService,
  ) {}

  @Get('/metrics')
  async metrics(@Res() res: Response): Promise<string> {
    res.type(register.contentType);
    return await register.metrics();
    // return await register.getSingleMetricAsString('test');
  }
}
