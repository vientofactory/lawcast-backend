import { Logger } from '@nestjs/common';

/**
 * 개발 환경 전용 로거 유틸리티
 * 프로덕션 환경에서 불필요한 로그 노이즈를 방지합니다.
 */
export class LoggerUtils {
  private static readonly isDevelopment =
    process.env.NODE_ENV === 'development';
  private static readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * 개발 환경에서만 디버그 로그를 출력합니다.
   */
  static debugDev(
    logger: Logger,
    message: string,
    ...optionalParams: any[]
  ): void {
    if (this.isDevelopment) {
      logger.debug(message, ...optionalParams);
    }
  }

  /**
   * 개발 환경에서만 일반 로그를 출력합니다.
   */
  static logDev(
    logger: Logger,
    message: string,
    ...optionalParams: any[]
  ): void {
    if (this.isDevelopment) {
      logger.log(message, ...optionalParams);
    }
  }

  /**
   * 프로덕션에서는 중요한 정보만, 개발에서는 상세 정보를 출력합니다.
   */
  static logConditional(
    logger: Logger,
    productionMessage: string,
    developmentMessage?: string,
    ...optionalParams: any[]
  ): void {
    if (this.isProduction) {
      logger.log(productionMessage, ...optionalParams);
    } else if (this.isDevelopment && developmentMessage) {
      logger.log(developmentMessage, ...optionalParams);
    } else {
      logger.log(productionMessage, ...optionalParams);
    }
  }

  /**
   * 환경에 관계없이 경고/에러 로그는 항상 출력합니다.
   */
  static warn(logger: Logger, message: string, ...optionalParams: any[]): void {
    logger.warn(message, ...optionalParams);
  }

  static error(
    logger: Logger,
    message: string,
    ...optionalParams: any[]
  ): void {
    logger.error(message, ...optionalParams);
  }

  /**
   * 현재 환경이 개발 환경인지 확인합니다.
   */
  static get isDev(): boolean {
    return this.isDevelopment;
  }

  /**
   * 현재 환경이 프로덕션 환경인지 확인합니다.
   */
  static get isProd(): boolean {
    return this.isProduction;
  }
}
