import { Injectable, Logger } from '@nestjs/common';
import {
  MessageBuilder,
  Webhook as DiscordWebhook,
} from 'discord-webhook-node';
import { type ITableData } from 'pal-crawl';
import { Webhook } from '../entities/webhook.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendDiscordNotification(
    notice: ITableData,
    webhooks: Webhook[],
  ): Promise<void> {
    const embed = new MessageBuilder()
      .setTitle('🏛️ 새로운 국회 입법예고')
      .setDescription(
        '새로운 입법예고가 감지되었습니다. 아래 정보를 확인하세요.',
      )
      .addField('📋 법률안명', notice.subject, false)
      .addField('👥 제안자 구분', notice.proposerCategory, true)
      .addField('🏢 소관위원회', notice.committee, true)
      .addField('💬 의견 수', notice.numComments.toString(), true)
      .addField('🔗 자세히 보기', `[링크 바로가기](${notice.link})`, false)
      .setColor(0x3b82f6) // Blue color
      .setTimestamp()
      .setFooter('LawCast 알림 서비스', '');

    for (const webhook of webhooks) {
      try {
        const discordWebhook = new DiscordWebhook(webhook.url);
        discordWebhook.setUsername('LawCast 알리미');

        await discordWebhook.send(embed);
        this.logger.log(`Notification sent to webhook ${webhook.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to send notification to webhook ${webhook.id}:`,
          error,
        );
      }
    }
  }

  async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const discordWebhook = new DiscordWebhook(webhookUrl);
      const testEmbed = new MessageBuilder()
        .setTitle('🧪 LawCast 웹훅 테스트')
        .setDescription('웹훅이 정상적으로 설정되었습니다!')
        .setColor(0x10b981) // Green color
        .setTimestamp();

      await discordWebhook.send(testEmbed);
      this.logger.log('Test webhook notification sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to send test webhook notification:', error);
      return false;
    }
  }
}
