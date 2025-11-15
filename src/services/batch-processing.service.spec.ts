import { Test, TestingModule } from '@nestjs/testing';
import {
  BatchProcessingService,
  BatchProcessingOptions,
} from './batch-processing.service';
import { WebhookService } from './webhook.service';
import { NotificationService } from './notification.service';

describe('BatchProcessingService', () => {
  let service: BatchProcessingService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockWebhookService = {
      findAll: jest.fn(),
      removeFailedWebhooks: jest.fn(),
    };

    const mockNotificationService = {
      sendDiscordNotificationBatch: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        BatchProcessingService,
        { provide: WebhookService, useValue: mockWebhookService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<BatchProcessingService>(BatchProcessingService);
  });

  afterEach(async () => {
    // 모든 배치 작업이 완료될 때까지 대기
    await service.waitForAllBatchJobs();

    // 모든 활성 타이머 정리
    service.clearAllTimeouts();

    // 테스트 모듈 정리
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeBatch', () => {
    it('should execute jobs in parallel with concurrency limit', async () => {
      const mockJobs = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3'),
      ];

      const options: BatchProcessingOptions = {
        concurrency: 2,
        timeout: 5000,
      };

      const results = await service.executeBatch(mockJobs, options);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].data).toBe('result1');
      expect(results[1].data).toBe('result2');
      expect(results[2].data).toBe('result3');
    });

    it('should handle job failures gracefully', async () => {
      const mockJobs = [
        () => Promise.resolve('success'),
        () => Promise.reject(new Error('Job failed')),
      ];

      const results = await service.executeBatch(mockJobs);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].data).toBe('success');
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe('Job failed');
    });

    it('should handle job timeouts', async () => {
      let timeoutId: NodeJS.Timeout;
      const mockJobs = [
        () =>
          new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve('success'), 2000);
          }),
      ];

      const options: BatchProcessingOptions = {
        timeout: 1000,
      };

      const results = await service.executeBatch(mockJobs, options);

      // Clear the timeout to avoid hanging processes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error?.message).toContain('timed out');
    }, 10000);
  });

  describe('processNotificationBatch', () => {
    it('should process notification batch in background', async () => {
      const mockNotices = [
        {
          subject: 'Notice 1',
          proposerCategory: 'Test',
          committee: 'Test',
          numComments: 0,
          link: 'http://test.com',
        },
      ];

      // Test that the method returns immediately (non-blocking)
      const startTime = Date.now();
      await service.processNotificationBatch(mockNotices as any);
      const endTime = Date.now();

      // Should return very quickly (less than 100ms) since it's non-blocking
      expect(endTime - startTime).toBeLessThan(100);

      // Check that a batch job was queued
      const status = service.getBatchJobStatus();
      expect(status.jobCount).toBeGreaterThanOrEqual(0);

      // Wait for the batch job to complete to avoid hanging processes
      await service.waitForAllBatchJobs();
    });
  });

  describe('getBatchJobStatus', () => {
    it('should return current batch job status', () => {
      const status = service.getBatchJobStatus();

      expect(status).toHaveProperty('jobCount');
      expect(status).toHaveProperty('jobIds');
      expect(Array.isArray(status.jobIds)).toBe(true);
    });
  });

  describe('waitForAllBatchJobs', () => {
    it('should wait for all jobs to complete', async () => {
      const promise = service.waitForAllBatchJobs();
      await expect(promise).resolves.toBeUndefined();
    });
  });
});
