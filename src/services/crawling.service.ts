import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PalCrawl, type ITableData } from 'pal-crawl';
import { WebhookService } from './webhook.service';
import { NotificationService } from './notification.service';
import { CacheService } from './cache.service';

@Injectable()
export class CrawlingService {
  private readonly logger = new Logger(CrawlingService.name);
  private isProcessing = false;

  constructor(
    private webhookService: WebhookService,
    private notificationService: NotificationService,
    private cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    if (this.isProcessing) {
      this.logger.warn(
        'Previous crawling process is still running, skipping...',
      );
      return;
    }

    this.logger.log('Starting legislative notice check...');
    this.isProcessing = true;

    try {
      await this.performCrawlingAndNotification();
    } catch (error) {
      this.logger.error('Error during crawling process', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async manualCheck(): Promise<ITableData[]> {
    if (this.isProcessing) {
      throw new Error('Crawling process is already running');
    }

    this.logger.log('Manual check initiated');
    this.isProcessing = true;

    try {
      return await this.performCrawlingAndNotification();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 크롤링과 알림을 수행하는 메인 로직
   */
  private async performCrawlingAndNotification(): Promise<ITableData[]> {
    const palCrawl = new PalCrawl();
    const crawledData = await palCrawl.get();

    if (!crawledData || crawledData.length === 0) {
      this.logger.warn('No data received from crawler');
      return [];
    }

    // 캐시 업데이트
    this.cacheService.updateCache(crawledData);

    // 새로운 입법예고 찾기
    const newNotices = this.cacheService.findNewNotices(crawledData);

    if (newNotices.length > 0) {
      this.logger.log(`Found ${newNotices.length} new notices`);
      await this.sendNotifications(newNotices);
    } else {
      this.logger.log('No new notices found');
    }

    return newNotices;
  }

  /**
   * 병렬로 알림을 전송하고 실패한 웹훅을 자동 삭제
   */
  private async sendNotifications(notices: ITableData[]): Promise<void> {
    const webhooks = await this.webhookService.findAll();

    if (webhooks.length === 0) {
      this.logger.warn('No active webhooks found');
      return;
    }

    // 각 입법예고에 대해 모든 웹훅으로 병렬 전송
    const notificationPromises = notices.map(async (notice) => {
      const results =
        await this.notificationService.sendDiscordNotificationBatch(
          notice,
          webhooks,
        );

      // 실패한 웹훅들을 자동 삭제
      const failedWebhookIds = results
        .filter((result) => !result.success)
        .map((result) => result.webhookId);

      if (failedWebhookIds.length > 0) {
        await this.webhookService.removeFailedWebhooks(failedWebhookIds);
        this.logger.warn(
          `Removed ${failedWebhookIds.length} failed webhooks: ${failedWebhookIds.join(', ')}`,
        );
      }
    });

    await Promise.all(notificationPromises);
    this.logger.log(`Sent notifications for ${notices.length} notices`);
  }

  /**
   * 캐시에서 최근 입법예고를 반환
   */
  getRecentNotices(limit: number = 10): ITableData[] {
    return this.cacheService.getRecentNotices(limit);
  }

  /**
   * 캐시 정보를 반환
   */
  getCacheInfo() {
    return this.cacheService.getCacheInfo();
  }
}
