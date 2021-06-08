import {
  HttpModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { PrometheusModule } from './prometheus/prometheus.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { ChiaModule } from './chia/chia.module';

@Module({
  imports: [
    HttpModule,
    TerminusModule,
    ScheduleModule.forRoot(),

    ChiaModule,
    ConfigModule,
    PrometheusModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  constructor() {
    ConfigService.getInstance();
  }

  public configure(consumer: MiddlewareConsumer): void {
    consumer;
  }
}
