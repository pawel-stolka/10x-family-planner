import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  let appController: AppController;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getInfo', () => {
    it('should return API information', () => {
      const result = appController.getInfo();
      expect(result).toHaveProperty('name', 'Family Planner API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('documentation', '/api/docs');
    });
  });

  describe('getHealth', () => {
    it('should return health check information', () => {
      const result = appController.getHealth();
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
