import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PalCrawl, type ITableData } from 'pal-crawl';
import { LegislativeNotice } from '../entities/legislative-notice.entity';
import { WebhookService } from './webhook.service';
import { NotificationService } from './notification.service';

@Injectable()
export class CrawlingService {
  private readonly logger = new Logger(CrawlingService.name);

  constructor(
    @InjectRepository(LegislativeNotice)
    private noticeRepository: Repository<LegislativeNotice>,
    private webhookService: WebhookService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.log('Starting legislative notice check...');

    try {
      const palCrawl = new PalCrawl();
      const newData = await palCrawl.get();

      if (!newData || newData.length === 0) {
        this.logger.warn('No data received from crawler');
        return;
      }

      const newNotices = await this.findNewNotices(newData);

      if (newNotices.length > 0) {
        this.logger.log(`Found ${newNotices.length} new notices`);
        await this.saveNewNotices(newNotices);
        await this.sendNotifications(newNotices);
      } else {
        this.logger.log('No new notices found');
      }
    } catch (error) {
      this.logger.error('Error during crawling process', error);
    }
  }

  async manualCheck(): Promise<ITableData[]> {
    this.logger.log('Manual check initiated');

    const palCrawl = new PalCrawl();
    const data = await palCrawl.get();

    const newNotices = await this.findNewNotices(data);

    if (newNotices.length > 0) {
      await this.saveNewNotices(newNotices);
      await this.sendNotifications(newNotices);
    }

    return newNotices;
  }

  private async findNewNotices(
    crawledData: ITableData[],
  ): Promise<ITableData[]> {
    const existingNums = await this.noticeRepository
      .find({ select: ['num'] })
      .then((notices) => notices.map((notice) => notice.num));

    return crawledData.filter((item) => !existingNums.includes(item.num));
  }

  private async saveNewNotices(notices: ITableData[]): Promise<void> {
    const noticeEntities = notices.map((notice) =>
      this.noticeRepository.create({
        num: notice.num,
        subject: notice.subject,
        proposerCategory: notice.proposerCategory,
        committee: notice.committee,
        numComments: notice.numComments,
        link: notice.link,
        isNotified: false,
      }),
    );

    await this.noticeRepository.save(noticeEntities);
    this.logger.log(`Saved ${notices.length} new notices to database`);
  }

  private async sendNotifications(notices: ITableData[]): Promise<void> {
    const webhooks = await this.webhookService.findAll();

    if (webhooks.length === 0) {
      this.logger.warn('No active webhooks found');
      return;
    }

    for (const notice of notices) {
      await this.notificationService.sendDiscordNotification(notice, webhooks);

      // 알림 전송 완료 표시
      await this.noticeRepository.update(
        { num: notice.num },
        { isNotified: true },
      );
    }

    this.logger.log(`Sent notifications for ${notices.length} notices`);
  }

  async getRecentNotices(limit: number = 10): Promise<LegislativeNotice[]> {
    return this.noticeRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
