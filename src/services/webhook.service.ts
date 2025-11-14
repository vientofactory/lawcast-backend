import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
  ) {}

  async create(createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    // TODO: reCAPTCHA 검증 로직 추가
    await this.verifyRecaptcha(createWebhookDto.recaptchaToken);

    // 중복 URL 체크
    const existingWebhook = await this.webhookRepository.findOne({
      where: { url: createWebhookDto.url },
    });

    if (existingWebhook) {
      throw new HttpException(
        'Webhook URL already exists',
        HttpStatus.CONFLICT,
      );
    }

    const webhook = this.webhookRepository.create({
      url: createWebhookDto.url,
      description: createWebhookDto.description,
    });

    return this.webhookRepository.save(webhook);
  }

  async findAll(): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: number): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    return webhook;
  }

  async remove(id: number): Promise<void> {
    const webhook = await this.findOne(id);
    webhook.isActive = false;
    await this.webhookRepository.save(webhook);
  }

  private async verifyRecaptcha(token: string): Promise<void> {
    // TODO: Google reCAPTCHA 검증 구현
    // 현재는 단순히 토큰이 존재하는지만 확인
    if (!token || token.trim() === '') {
      throw new HttpException(
        'Invalid reCAPTCHA token',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
