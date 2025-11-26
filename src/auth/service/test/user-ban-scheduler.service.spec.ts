import { Test, TestingModule } from '@nestjs/testing';

import { UserBanSchedulerService } from '../user-ban-scheduler.service';
import { UserService } from '../user.service';

describe('UserBanSchedulerService', () => {
  let service: UserBanSchedulerService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBanSchedulerService,
        {
          provide: UserService,
          useValue: {
            unbanExpiredUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserBanSchedulerService>(UserBanSchedulerService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleAutoUnban', () => {
    it('should successfully unban expired users', async () => {
      jest.spyOn(userService, 'unbanExpiredUsers').mockResolvedValue(3);

      await service.handleAutoUnban();

      expect(userService.unbanExpiredUsers).toHaveBeenCalled();
    });

    it('should handle zero unbanned users', async () => {
      jest.spyOn(userService, 'unbanExpiredUsers').mockResolvedValue(0);

      await service.handleAutoUnban();

      expect(userService.unbanExpiredUsers).toHaveBeenCalled();
    });

    it('should handle errors during auto-unban', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
      jest.spyOn(userService, 'unbanExpiredUsers').mockRejectedValue(new Error('Database error'));

      await service.handleAutoUnban();

      expect(loggerSpy).toHaveBeenCalledWith('Error during auto-unban check:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });
});
