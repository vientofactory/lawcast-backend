import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiController } from './controllers/api.controller';
import { WebhookService } from './services/webhook.service';
import { CrawlingService } from './services/crawling.service';
import { NotificationService } from './services/notification.service';
import { Webhook } from './entities/webhook.entity';
import { LegislativeNotice } from './entities/legislative-notice.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'lawcast.db',
      entities: [Webhook, LegislativeNotice],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Webhook, LegislativeNotice]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, ApiController],
  providers: [AppService, WebhookService, CrawlingService, NotificationService],
})
export class AppModule {}
