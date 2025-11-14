import { IsString, IsUrl, IsOptional, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsString()
  recaptchaToken: string;
}
