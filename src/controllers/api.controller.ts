import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import { CrawlingService } from '../services/crawling.service';
import { NotificationService } from '../services/notification.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

@Controller('api')
export class ApiController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly crawlingService: CrawlingService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createWebhook(@Body() createWebhookDto: CreateWebhookDto) {
    const webhook = await this.webhookService.create(createWebhookDto);

    // 웹훅 테스트 전송
    await this.notificationService.testWebhook(webhook.url);

    return {
      success: true,
      message: 'Webhook registered successfully',
      data: {
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        createdAt: webhook.createdAt,
      },
    };
  }

  @Get('webhooks')
  async getWebhooks() {
    const webhooks = await this.webhookService.findAll();
    return {
      success: true,
      data: webhooks.map((webhook) => ({
        id: webhook.id,
        description: webhook.description,
        createdAt: webhook.createdAt,
      })),
    };
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWebhook(@Param('id') id: string) {
    await this.webhookService.remove(+id);
  }

  @Post('check')
  async manualCheck() {
    const newNotices = await this.crawlingService.manualCheck();
    return {
      success: true,
      message: `Found ${newNotices.length} new notices`,
      data: newNotices,
    };
  }

  @Get('notices/recent')
  async getRecentNotices() {
    const notices = await this.crawlingService.getRecentNotices(20);
    return {
      success: true,
      data: notices,
    };
  }

  @Get('health')
  getHealth() {
    return {
      success: true,
      message: 'LawCast API is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
