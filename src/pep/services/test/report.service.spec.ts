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

  // --- Mock Data ---
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
    contentReviewed: 'Bad movie',
    status: REVIEW_STATUS.ACTIVE,
    user: mockUser,
    content: mockContent,
  } as any;

  const mockEpisodeReview = {
    id: 'ep-review-1',
    contentReviewed: 'Bad episode',
    status: REVIEW_STATUS.ACTIVE,
    user: mockUser,
    episode: {
      id: 'ep-1',
      episodeTitle: 'Ep 1',
      season: {
        tvseries: {
          metaData: { title: 'Series 1' },
        },
      },
    },
  } as any;

  const mockReport = {
    id: 'report-1',
    type: REPORT_TYPE.REVIEW,
    targetId: 'review-1',
    reason: 'Spam',
    status: REPORT_STATUS.PENDING,
    reporter: { id: 'reporter-1', name: 'Alice' },
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(EntityReport),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
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
            emailConfig: { fromName: 'CinemaTok' }, // Mock property access
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

  // =================================================================
  // 1. Create Report
  // =================================================================
  describe('createReport', () => {
    const dto: CreateReportDto = {
      type: REPORT_TYPE.REVIEW,
      targetId: 'review-1',
      reason: 'spam',
    } as any;

    it('should create a report for a valid Review', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      const result = await service.createReport('reporter-1', dto);

      expect(reviewRepository.findOne).toHaveBeenCalledWith({ where: { id: 'review-1' } });
      expect(reportRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if Review does not exist', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);
      await expect(service.createReport('reporter-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should create a report for a valid EpisodeReview', async () => {
      const epDto = { ...dto, type: REPORT_TYPE.EPISODE_REVIEW, targetId: 'ep-review-1' };
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      await service.createReport('reporter-1', epDto);

      expect(reviewEpisodeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'ep-review-1' },
      });
    });

    it('should throw NotFoundException if EpisodeReview does not exist', async () => {
      const epDto = { ...dto, type: REPORT_TYPE.EPISODE_REVIEW, targetId: 'ep-review-1' };
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);
      await expect(service.createReport('reporter-1', epDto)).rejects.toThrow(NotFoundException);
    });

    it('should create report without validation for other types', async () => {
      // Case: type is 'COMMENT' or something else not strictly checked in the `if/else if` block
      const otherDto = { ...dto, type: 'COMMENT' as any, targetId: 'comment-1' };
      jest.spyOn(reportRepository, 'create').mockReturnValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockResolvedValue(mockReport);

      await service.createReport('reporter-1', otherDto);

      // Should not query review repos
      expect(reviewRepository.findOne).not.toHaveBeenCalled();
      expect(reviewEpisodeRepository.findOne).not.toHaveBeenCalled();
      expect(reportRepository.save).toHaveBeenCalled();
    });
  });

  // =================================================================
  // 2. Find All Reports (Complex Logic: Search, Sort, Enrich)
  // =================================================================
  describe('findAllReports', () => {
    const reportsList = [
      {
        ...mockReport,
        id: 'r1',
        reason: 'spam content',
        reporter: { name: 'Alice' },
        status: 'PENDING',
        type: REPORT_TYPE.REVIEW,
      },
      {
        ...mockReport,
        id: 'r2',
        reason: 'bad language',
        reporter: { name: 'Bob' },
        status: 'APPROVED',
        type: REPORT_TYPE.EPISODE_REVIEW,
      },
      {
        ...mockReport,
        id: 'r3',
        reason: 'spam link',
        reporter: { name: 'Charlie' },
        status: 'REJECTED',
        type: REPORT_TYPE.REVIEW,
      },
    ];

    beforeEach(() => {
      // Default mock return
      jest.spyOn(reportRepository, 'findAndCount').mockResolvedValue([reportsList, 3]);
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
    });

    it('should return all reports enriched with relations', async () => {
      const result = await service.findAllReports();

      expect(reportRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toHaveLength(3);
      // Check enrichment
      expect(result.data[0].review).toBeDefined(); // Type REVIEW
      expect(result.data[1].episodeReview).toBeDefined(); // Type EPISODE_REVIEW
    });

    it('should filter by status via DB query', async () => {
      await service.findAllReports({ status: 'PENDING' });
      expect(reportRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } }),
      );
    });

    // --- Test In-Memory Filtering Logic ---
    it('should filter by search JSON string (reason)', async () => {
      const searchJson = JSON.stringify({ reason: 'spam' });
      const result = await service.findAllReports({ search: searchJson });

      // Should match r1 (spam content) and r3 (spam link)
      expect(result.data).toHaveLength(2);
      expect(result.data.map(r => r.id)).toEqual(['r1', 'r3']);
    });

    it('should filter by search JSON string (reporterName)', async () => {
      const searchJson = JSON.stringify({ reporterName: 'Bob' });
      const result = await service.findAllReports({ search: searchJson });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r2');
    });

    it('should filter by search JSON string (type)', async () => {
      const searchJson = JSON.stringify({ type: REPORT_TYPE.EPISODE_REVIEW });
      const result = await service.findAllReports({ search: searchJson });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r2');
    });

    it('should filter by search JSON string (status)', async () => {
      const searchJson = JSON.stringify({ status: 'REJECTED' });
      const result = await service.findAllReports({ search: searchJson });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r3');
    });

    it('should return empty if search key does not match any logic', async () => {
      const searchJson = JSON.stringify({ unknownKey: 'value' });
      const result = await service.findAllReports({ search: searchJson });
      expect(result.data).toHaveLength(0);
    });

    // --- Test In-Memory Sorting Logic ---
    it('should sort by reporterName ASC', async () => {
      const sortJson = JSON.stringify({ reporterName: 'ASC' });
      const result = await service.findAllReports({ sort: sortJson });

      // Alice -> Bob -> Charlie
      expect(result.data[0].id).toBe('r1');
      expect(result.data[1].id).toBe('r2');
      expect(result.data[2].id).toBe('r3');
    });

    it('should sort by reporterName DESC', async () => {
      const sortJson = JSON.stringify({ reporterName: 'DESC' });
      const result = await service.findAllReports({ sort: sortJson });

      // Charlie -> Bob -> Alice
      expect(result.data[0].id).toBe('r3');
      expect(result.data[1].id).toBe('r2');
      expect(result.data[2].id).toBe('r1');
    });

    it('should sort by standard field (reason) ASC', async () => {
      const sortJson = JSON.stringify({ reason: 'ASC' });
      // b(ad language) -> spam c(ontent) -> spam l(ink)
      const result = await service.findAllReports({ sort: sortJson });
      expect(result.data[0].id).toBe('r2');
      expect(result.data[1].id).toBe('r1');
      expect(result.data[2].id).toBe('r3');
    });

    it('should handle empty reporter name in sorting', async () => {
      const listWithEmpty = [
        { ...mockReport, id: 'r1', reporter: null },
        { ...mockReport, id: 'r2', reporter: { name: 'Alice' } },
      ];
      jest.spyOn(reportRepository, 'findAndCount').mockResolvedValue([listWithEmpty, 2]);

      const sortJson = JSON.stringify({ reporterName: 'ASC' });
      const result = await service.findAllReports({ sort: sortJson });

      // Empty string < 'Alice'
      expect(result.data[0].id).toBe('r1');
    });
  });

  // =================================================================
  // 3. Find By ID & Delete
  // =================================================================
  describe('findReportById', () => {
    it('should return report if found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      expect(await service.findReportById('r1')).toEqual(mockReport);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findReportById('r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteReport', () => {
    it('should delete successfully', async () => {
      jest.spyOn(service, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'remove').mockResolvedValue(mockReport);

      await service.deleteReport('r1');
      expect(reportRepository.remove).toHaveBeenCalledWith(mockReport);
    });

    it('should throw error if finding report fails', async () => {
      jest.spyOn(service, 'findReportById').mockRejectedValue(new NotFoundException());
      await expect(service.deleteReport('r1')).rejects.toThrow(NotFoundException);
    });
  });

  // =================================================================
  // 4. Ban Item (Review & Episode Review)
  // =================================================================
  describe('banItem', () => {
    // --- Review ---
    it('should ban a Review, update reports, and email user', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest.spyOn(reviewRepository, 'save').mockImplementation(async e => e as any);
      jest.spyOn(reportRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.banItem('review', 'review-1');

      // 1. Review status updated
      expect(reviewRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REVIEW_STATUS.BANNED }),
      );
      // 2. Reports updated
      expect(reportRepository.update).toHaveBeenCalledWith(
        { targetId: 'review-1', type: REPORT_TYPE.REVIEW },
        { status: REPORT_STATUS.APPROVED },
      );
      // 3. Email sent
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockReview.user.email,
        'Review Banned',
        expect.stringContaining('Review Banned'),
      );
    });

    it('should throw NotFoundException if Review not found', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);
      await expect(service.banItem('review', 'review-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if Review User has no email', async () => {
      const noEmailReview = { ...mockReview, user: { ...mockUser, email: null } };
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(noEmailReview);

      await expect(service.banItem('review', 'review-1')).rejects.toThrow('User email not found');
    });

    // --- Episode Review ---
    it('should ban an Episode Review, update reports, and email user', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest.spyOn(reviewEpisodeRepository, 'save').mockImplementation(async e => e as any);
      jest.spyOn(reportRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      // Test with mixed case type input 'Episode_Review' -> 'episode-review'
      await service.banItem('Episode_Review', 'ep-review-1');

      expect(reviewEpisodeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REVIEW_STATUS.BANNED }),
      );
      expect(reportRepository.update).toHaveBeenCalledWith(
        { targetId: 'ep-review-1', type: REPORT_TYPE.EPISODE_REVIEW },
        { status: REPORT_STATUS.APPROVED },
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockEpisodeReview.user.email,
        'Episode Review Banned',
        expect.stringContaining('Episode Review Banned'),
      );
    });

    it('should throw NotFoundException if Episode Review not found', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);
      await expect(service.banItem('episode-review', 'ep-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if Episode Review User has no email', async () => {
      const noEmailEpReview = { ...mockEpisodeReview, user: { ...mockUser, email: null } };
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(noEmailEpReview);

      await expect(service.banItem('episode-review', 'ep-1')).rejects.toThrow(
        'User email not found',
      );
    });

    // --- Invalid Type ---
    it('should throw NotFoundException for invalid item type', async () => {
      await expect(service.banItem('unknown-type', 'id')).rejects.toThrow('Invalid type');
    });
  });

  // =================================================================
  // 5. Unban Item
  // =================================================================
  describe('unbanItem', () => {
    // --- Review ---
    it('should unban a Review and email user', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview);
      jest.spyOn(reviewRepository, 'save').mockImplementation(async e => e as any);

      await service.unbanItem('REVIEW', 'review-1'); // Test uppercase input

      expect(reviewRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REVIEW_STATUS.ACTIVE }),
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockReview.user.email,
        'Review Restored',
        expect.stringContaining('Review Restored'),
      );
    });

    it('should throw NotFoundException if Review not found (unban)', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);
      await expect(service.unbanItem('review', 'id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if User email missing (unban review)', async () => {
      const noEmailReview = { ...mockReview, user: { email: null } };
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(noEmailReview);
      await expect(service.unbanItem('review', 'id')).rejects.toThrow('User email not found');
    });

    // --- Episode Review ---
    it('should unban an Episode Review and email user', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(mockEpisodeReview);
      jest.spyOn(reviewEpisodeRepository, 'save').mockImplementation(async e => e as any);

      await service.unbanItem('episode-review', 'ep-review-1');

      expect(reviewEpisodeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REVIEW_STATUS.ACTIVE }),
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockEpisodeReview.user.email,
        'Episode Review Restored',
        expect.stringContaining('Episode Review Restored'),
      );
    });

    it('should throw NotFoundException if Episode Review not found (unban)', async () => {
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(null);
      await expect(service.unbanItem('episode-review', 'id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if User email missing (unban ep review)', async () => {
      const noEmailEpReview = { ...mockEpisodeReview, user: { email: null } };
      jest.spyOn(reviewEpisodeRepository, 'findOne').mockResolvedValue(noEmailEpReview);
      await expect(service.unbanItem('episode-review', 'id')).rejects.toThrow(
        'User email not found',
      );
    });

    // --- Invalid Type ---
    it('should throw NotFoundException for invalid item type (unban)', async () => {
      await expect(service.unbanItem('unknown', 'id')).rejects.toThrow('Invalid type');
    });
  });

  // =================================================================
  // 6. Approve / Reject Report Items
  // =================================================================
  describe('approveItem', () => {
    it('should approve a report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockImplementation(async e => e as any);

      await service.approveItem('report', 'r1');

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REPORT_STATUS.APPROVED }),
      );
    });

    it('should throw NotFoundException if report not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);
      await expect(service.approveItem('report', 'r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectItem', () => {
    it('should reject a report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(mockReport);
      jest.spyOn(reportRepository, 'save').mockImplementation(async e => e as any);

      await service.rejectItem('report', 'r1');

      expect(reportRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: REPORT_STATUS.REJECTED }),
      );
    });

    it('should throw NotFoundException if report not found', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValue(null);
      await expect(service.rejectItem('report', 'r1')).rejects.toThrow(NotFoundException);
    });
  });
});
