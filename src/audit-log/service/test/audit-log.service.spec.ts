import { Repository } from 'typeorm';

import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EntityUser } from '../../../auth/entities/user.entity';
import { VideoService } from '../../../cms/services/video.service';
import { CreateAuditLogDto } from '../../dtos/audit-log.dto';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogService } from '../audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: Repository<AuditLog>;
  let userRepository: Repository<EntityUser>;
  let videoService: VideoService;

  const mockAuditLog = {
    id: 'audit-1',
    userId: 'user-1',
    action: LOG_ACTION.USER_LOGIN,
    description: 'User logged in',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  } as EntityUser;

  const mockVideoService = {
    getMovieOrSeriesIdFromVideo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityUser),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: VideoService,
          useValue: mockVideoService,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    userRepository = module.get<Repository<EntityUser>>(getRepositoryToken(EntityUser));
    videoService = module.get<VideoService>(VideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log entry', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        userId: 'user-1',
        action: LOG_ACTION.USER_LOGIN,
        description: 'User logged in',
      };

      const expectedAuditLog = { ...createAuditLogDto, id: 'audit-1', createdAt: new Date() };

      jest.spyOn(auditLogRepository, 'create').mockReturnValue(expectedAuditLog as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue(expectedAuditLog as any);

      const result = await service.log(createAuditLogDto);

      expect(auditLogRepository.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(auditLogRepository.save).toHaveBeenCalledWith(expectedAuditLog);
      expect(result).toEqual(expectedAuditLog);
    });

    it('should handle different log actions', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        userId: 'user-1',
        action: LOG_ACTION.CONTENT_VIEW_INCREASED,
        description: 'Content viewed',
      };

      const expectedAuditLog = { ...createAuditLogDto, id: 'audit-2', createdAt: new Date() };

      jest.spyOn(auditLogRepository, 'create').mockReturnValue(expectedAuditLog as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue(expectedAuditLog as any);

      const result = await service.log(createAuditLogDto);

      expect(auditLogRepository.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(auditLogRepository.save).toHaveBeenCalledWith(expectedAuditLog);
      expect(result.action).toBe(LOG_ACTION.CONTENT_VIEW_INCREASED);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const mockLogs = [mockAuditLog];
      const mockTotal = 1;

      jest.spyOn(auditLogRepository, 'find').mockResolvedValue(mockLogs);
      jest.spyOn(auditLogRepository, 'count').mockResolvedValue(mockTotal);

      const result = await service.findAll(query);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        result: mockLogs,
        total: mockTotal,
      });
    });

    it('should handle pagination with default values', async () => {
      const query: PaginationQueryDto = {};
      const mockLogs = [mockAuditLog];
      const mockTotal = 1;

      jest.spyOn(auditLogRepository, 'find').mockResolvedValue(mockLogs);
      jest.spyOn(auditLogRepository, 'count').mockResolvedValue(mockTotal);

      const result = await service.findAll(query);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
      });
      expect(result.result).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should handle custom pagination', async () => {
      const query: PaginationQueryDto = { page: 2, limit: 20 };
      const mockLogs = [mockAuditLog];
      const mockTotal = 25;

      jest.spyOn(auditLogRepository, 'find').mockResolvedValue(mockLogs);
      jest.spyOn(auditLogRepository, 'count').mockResolvedValue(mockTotal);

      const result = await service.findAll(query);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        order: { createdAt: 'DESC' },
      });
      expect(result.result).toEqual(mockLogs);
      expect(result.total).toBe(25);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity with user names', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const mockLogs = [
        {
          log_id: 'audit-1',
          log_userId: 'user-1',
          log_action: LOG_ACTION.USER_LOGIN,
          log_description: 'User logged in',
          log_createdAt: new Date(),
        },
      ];

      const mockUsers = [{ user_id: 'user-1', user_name: 'Test User' }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockLogs),
        getCount: jest.fn().mockResolvedValue(1),
      };

      const mockUserQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUsers),
      };

      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockUserQueryBuilder as any);

      const result = await service.getRecentActivity(query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.createdAt >= :sevenDaysAgo', {
        sevenDaysAgo: expect.any(Date),
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.action != :excludedAction', {
        excludedAction: LOG_ACTION.CONTENT_VIEW_INCREASED,
      });
      expect(result.result[0].userName).toBe('Test User');
      expect(result.total).toBe(1);
    });

    it('should handle empty results', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      const mockUserQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockUserQueryBuilder as any);

      const result = await service.getRecentActivity(query);

      expect(result.result).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle user not found in mapping', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };

      const mockLogs = [
        {
          log_id: 'audit-1',
          log_userId: 'user-1',
          log_action: LOG_ACTION.USER_LOGIN,
          log_description: 'User logged in',
          log_createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockLogs),
        getCount: jest.fn().mockResolvedValue(1),
      };

      const mockUserQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(auditLogRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue(mockUserQueryBuilder as any);

      const result = await service.getRecentActivity(query);

      expect(result.result[0].userName).toBe('Unknown User');
    });
  });

  describe('logVideoAction', () => {
    it('should log video action for movie', async () => {
      const userId = 'user-1';
      const videoId = 'video-1';

      mockVideoService.getMovieOrSeriesIdFromVideo.mockResolvedValue({
        movieId: 'movie-1',
      });

      jest.spyOn(service, 'log').mockResolvedValue(mockAuditLog);

      await service.logVideoAction(userId, videoId);

      expect(mockVideoService.getMovieOrSeriesIdFromVideo).toHaveBeenCalledWith(videoId);
      expect(service.log).toHaveBeenCalledWith({
        userId,
        action: LOG_ACTION.PLAY_MOVIE,
        description: `User ${userId} played movie with ID movie-1`,
      });
    });

    it('should log video action for series', async () => {
      const userId = 'user-1';
      const videoId = 'video-1';

      mockVideoService.getMovieOrSeriesIdFromVideo.mockResolvedValue({
        tvSeriesId: 'series-1',
      });

      jest.spyOn(service, 'log').mockResolvedValue(mockAuditLog);

      await service.logVideoAction(userId, videoId);

      expect(mockVideoService.getMovieOrSeriesIdFromVideo).toHaveBeenCalledWith(videoId);
      expect(service.log).toHaveBeenCalledWith({
        userId,
        action: LOG_ACTION.PLAY_EPISODE_OF_SERIES,
        description: `User ${userId} played series with ID series-1`,
      });
    });

    it('should throw NotFoundException when video not found', async () => {
      const userId = 'user-1';
      const videoId = 'video-1';

      mockVideoService.getMovieOrSeriesIdFromVideo.mockRejectedValue(
        new NotFoundException('Video not found'),
      );

      await expect(service.logVideoAction(userId, videoId)).rejects.toThrow(NotFoundException);
      expect(mockVideoService.getMovieOrSeriesIdFromVideo).toHaveBeenCalledWith(videoId);
    });

    it('should handle video with no movie or series ID', async () => {
      const userId = 'user-1';
      const videoId = 'video-1';

      mockVideoService.getMovieOrSeriesIdFromVideo.mockResolvedValue({});

      jest.spyOn(service, 'log').mockResolvedValue(mockAuditLog);

      await service.logVideoAction(userId, videoId);

      expect(mockVideoService.getMovieOrSeriesIdFromVideo).toHaveBeenCalledWith(videoId);
      expect(service.log).not.toHaveBeenCalled();
    });
  });
});
