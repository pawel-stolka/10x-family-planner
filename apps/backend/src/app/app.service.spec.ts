import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getInfo', () => {
    it('should return API information', () => {
      const result = service.getInfo();
      expect(result).toHaveProperty('name', 'Family Planner API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('documentation', '/api/docs');
    });
  });

  describe('getHealth', () => {
    it('should return health check information', () => {
      const result = service.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('memory');
      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('unit', 'MB');
    });
  });
});
