import { Repository } from 'typeorm';

import { REPORT_STATUS, REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EmailService } from '../../../auth/service/email.service';
import { CreateReportDto } from '../../dtos/report.dto';
import { EntityReport } from '../../entities/report.entity';
import { EntityReviewEpisode } from '../../entities/review-episode.entity';
import { EntityReview } from '../../entities/review.entity';
import { ReportService } from '../report.service';

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: Repository<EntityReport>;
  let reviewRepository: Repository<EntityReview>;
  let reviewEpisodeRepository: Repository<EntityReviewEpisode>;
  let emailService: EmailService;

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  } as any;

  const mockContent = {
    id: 'content-1',
    title: 'Test Content',
  } as any;

  const mockReview = {
    id: 'review-1',
    contentReviewed: 'Great movie!',
    status: REVIEW_STATUS.ACTIVE,
    user: mockUser,
    content: mockContent,
  } as any;

  const mockEpisode = {
    id: 'episode-1',
    episodeTitle: 'Episode 1',
    season: {
      tvseries: {
        metaData: {
          title: 'Test Series',
        },
      },
    },
  } as any;

  const mockEpisodeReview = {
    id: 'episode-review-1',
    contentReviewed: 'Great episode!',
    status: REVIEW_STATUS.ACTIVE,
    user: mockUser,
    episode: mockEpisode,
  } as any;

  const mockReport = {
    id: 'report-1',
    type: REPORT_TYPE.REVIEW,
    targetId: 'review-1',
    reason: 'Inappropriate content',
    status: REPORT_STATUS.PENDING,
    reporter: mockUser,
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(EntityReport),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityReview),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityReviewEpisode),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
            emailConfig: { fromName: 'CinemaTok' },
          },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepository = module.get<Repository<EntityReport>>(getRepositoryToken(EntityReport));
    reviewRepository = module.get<Repository<EntityReview>>(getRepositoryToken(EntityReview));
    reviewEpisodeRepository = module.get<Repository<EntityReviewEpisode>>(
      getRepositoryToken(EntityReviewEpisode),
    );
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  describe('createReport', () => {
    const createDto: CreateReportDto = {
      type: REPORT_TYPE.REVIEW,
      targetId: 'review-1',
      reason: 'Inappropriate',
    } as any;

    it('should create report for review', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      const result = await service.createReport('user-1', createDto);

      expect(result).toEqual(mockReport);
      expect(reviewRepository.findOne).toHaveBeenCalledWith({ where: { id: 'review-1' } });
      expect(reportRepository.save).toHaveBeenCalled();
    });

    it('should create report for episode review', async () => {
      const dto = { ...createDto, type: REPORT_TYPE.EPISODE_REVIEW, targetId: 'episode-review-1' };
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      const result = await service.createReport('user-1', dto);

      expect(result).toEqual(mockReport);
      expect(reviewEpisodeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'episode-review-1' },
      });
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createReport('user-1', createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllReports', () => {
    it('should return reports with enrichment', async () => {
      jest.spyOn(reportRepository, 'findAndCount').mockResolvedValue([[mockReport], 1]);
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);

      const result = await service.findAllReports({ page: 1, limit: 10 });

      expect(result.data[0].review).toEqual(mockReview);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      jest.spyOn(reportRepository, 'findAndCount').mockResolvedValue([[mockReport], 1]);

      await service.findAllReports({ status: REPORT_STATUS.PENDING });

      expect(reportRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: REPORT_STATUS.PENDING },
        relations: ['reporter'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findReportById', () => {
    it('should return report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);

      const result = await service.findReportById('report-1');

      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findReportById('report-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteReport', () => {
    it('should delete report', async () => {
      jest.spyOn(service, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'remove').mockResolvedValue(mockReport);

      await service.deleteReport('report-1');

      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });
  });

  describe('banItem', () => {
    it('should ban review and send email', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest
        .spyOn(reviewRepository, 'save')
        .mockResolvedValue({ ...mockReview, status: REVIEW_STATUS.BANNED });
      jest.spyOn(reportRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValue();

      await service.banItem('review', 'review-1');

      expect(reviewRepository.save).toHaveBeenCalledWith({
        ...mockReview,
        status: REVIEW_STATUS.BANNED,
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Review Banned',
        expect.stringContaining('Review Banned'),
      );
    });

    it('should ban episode review and send email', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest
        .spyOn(reviewEpisodeRepository, 'save')
        .mockResolvedValue({ ...mockEpisodeReview, status: REVIEW_STATUS.BANNED });
      jest.spyOn(reportRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(emailService, 'sendEmail').mockResolvedValue();

      await service.banItem('episode-review', 'episode-review-1');

      expect(reviewEpisodeRepository.save).toHaveBeenCalledWith({
        ...mockEpisodeReview,
        status: REVIEW_STATUS.BANNED,
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Episode Review Banned',
        expect.stringContaining('Episode Review Banned'),
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      await expect(service.banItem('review', 'review-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unbanItem', () => {
    it('should unban review and send email', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest
        .spyOn(reviewRepository, 'save')
        .mockResolvedValue({ ...mockReview, status: REVIEW_STATUS.ACTIVE });
      jest.spyOn(emailService, 'sendEmail').mockResolvedValue();

      await service.unbanItem('review', 'review-1');

      expect(reviewRepository.save).toHaveBeenCalledWith({
        ...mockReview,
        status: REVIEW_STATUS.ACTIVE,
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Review Restored',
        expect.stringContaining('Review Restored'),
      );
    });

    it('should unban episode review and send email', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest
        .spyOn(reviewEpisodeRepository, 'save')
        .mockResolvedValue({ ...mockEpisodeReview, status: REVIEW_STATUS.ACTIVE });
      jest.spyOn(emailService, 'sendEmail').mockResolvedValue();

      await service.unbanItem('episode-review', 'episode-review-1');

      expect(reviewEpisodeRepository.save).toHaveBeenCalledWith({
        ...mockEpisodeReview,
        status: REVIEW_STATUS.ACTIVE,
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        'Episode Review Restored',
        expect.stringContaining('Episode Review Restored'),
      );
    });
  });

  describe('approveItem', () => {
    it('should approve report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest
        .spyOn(reportRepository, 'save')
        .mockResolvedValue({ ...mockReport, status: REPORT_STATUS.APPROVED });

      await service.approveItem('report', 'report-1');

      expect(reportRepository.save).toHaveBeenCalledWith({
        ...mockReport,
        status: REPORT_STATUS.APPROVED,
      });
    });

    it('should throw NotFoundException if report not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);

      await expect(service.approveItem('report', 'report-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectItem', () => {
    it('should reject report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest
        .spyOn(reportRepository, 'save')
        .mockResolvedValue({ ...mockReport, status: REPORT_STATUS.REJECTED });

      await service.rejectItem('report', 'report-1');

      expect(reportRepository.save).toHaveBeenCalledWith({
        ...mockReport,
        status: REPORT_STATUS.REJECTED,
      });
    });
  });
});
