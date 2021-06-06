import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import * as currency from 'currency.js';
import { register, Gauge, Counter, Histogram } from 'prom-client';

@Injectable()
export class ChiaFarmerService {
  gauge = new Gauge({
    name: 'test',
    help: 'my test gauge',
  });

  @Interval(5000)
  async something(): Promise<void> {
    this.gauge.set(0);
  }
}
