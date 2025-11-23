import { EmailService } from 'src/auth/service/email.service';

import { Repository } from 'typeorm';

import { REPORT_STATUS, REPORT_TYPE, REVIEW_STATUS } from '@app/common/enums/global.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateReportDto } from '../dtos/report.dto';
import { EntityReport } from '../entities/report.entity';
import { EntityReviewEpisode } from '../entities/review-episode.entity';
import { EntityReview } from '../entities/review.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(EntityReport)
    private readonly reportRepository: Repository<EntityReport>,
    @InjectRepository(EntityReview)
    private readonly reviewRepository: Repository<EntityReview>,
    @InjectRepository(EntityReviewEpisode)
    private readonly reviewEpisodeRepository: Repository<EntityReviewEpisode>,
    private readonly emailService: EmailService,
  ) {}

  async createReport(reporterId: string, createReportDto: CreateReportDto): Promise<EntityReport> {
    const { type, targetId } = createReportDto;

    // Check if the target exists
    if (type === REPORT_TYPE.REVIEW) {
      const review = await this.reviewRepository.findOne({ where: { id: targetId } });
      if (!review) {
        throw new NotFoundException('Review not found');
      }
    } else if (type === REPORT_TYPE.EPISODE_REVIEW) {
      const episodeReview = await this.reviewEpisodeRepository.findOne({ where: { id: targetId } });
      if (!episodeReview) {
        throw new NotFoundException('Episode review not found');
      }
    }

    const report = this.reportRepository.create({
      ...createReportDto,
      reporter: { id: reporterId } as any,
    });

    return this.reportRepository.save(report);
  }

  async findAllReports(
    query: { page?: number; limit?: number; sort?: string; search?: string; status?: string } = {},
  ): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 10, sort, search, status } = query;

    // Build where conditions for search
    const whereConditions: any = {};
    if (status) {
      whereConditions.status = status;
    }
    if (search) {
      const searchObj = typeof search === 'string' ? JSON.parse(search) : search;
      // For now, we'll handle search after fetching data since complex search with relations is tricky
    }

    // Get reports with relations
    const [reports, total] = await this.reportRepository.findAndCount({
      where: whereConditions,
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Debug: Log reporter information
    console.log(
      'Reports with reporter info:',
      reports.map(r => ({
        id: r.id,
        reporter: r.reporter,
        reporterId: r.reporter?.id,
        reporterName: r.reporter?.name,
        reporterEmail: r.reporter?.email,
      })),
    );

    // Apply search filtering if needed
    let filteredReports = reports;
    if (search) {
      const searchObj = typeof search === 'string' ? JSON.parse(search) : search;
      filteredReports = reports.filter(report => {
        return Object.entries(searchObj).some(([key, value]) => {
          const stringValue = String(value).toLowerCase();
          if (key === 'reason') {
            return report.reason.toLowerCase().includes(stringValue);
          } else if (key === 'reporterName') {
            return report.reporter?.name?.toLowerCase().includes(stringValue);
          } else if (key === 'type') {
            return report.type === value;
          } else if (key === 'status') {
            return report.status === value;
          }
          return false;
        });
      });
    }

    // Apply sorting
    if (sort) {
      const sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      filteredReports.sort((a, b) => {
        for (const [key, direction] of Object.entries(sortObj)) {
          let aValue: any, bValue: any;

          if (key === 'reporterName') {
            aValue = a.reporter?.name || '';
            bValue = b.reporter?.name || '';
          } else {
            aValue = (a as any)[key];
            bValue = (b as any)[key];
          }

          if (aValue < bValue) return direction === 'ASC' ? -1 : 1;
          if (aValue > bValue) return direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply pagination after filtering and sorting
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    // Enrich reports with target data
    const enrichedReports = await Promise.all(
      paginatedReports.map(async report => {
        const enrichedReport: any = {
          ...report,
          reporter: report.reporter, // Explicitly preserve reporter
        };

        if (report.type === REPORT_TYPE.REVIEW) {
          const review = await this.reviewRepository.findOne({
            where: { id: report.targetId },
            relations: ['user', 'content'],
          });
          enrichedReport.review = review;
        } else if (report.type === REPORT_TYPE.EPISODE_REVIEW) {
          const episodeReview = await this.reviewEpisodeRepository.findOne({
            where: { id: report.targetId },
            relations: [
              'user',
              'episode',
              'episode.season',
              'episode.season.tvseries',
              'episode.season.tvseries.metaData',
            ],
          });
          enrichedReport.episodeReview = episodeReview;
        }

        return enrichedReport;
      }),
    );
    return { data: enrichedReports, total: filteredReports.length };
  }

  async findReportById(id: string): Promise<EntityReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter'],
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    const report = await this.findReportById(id);
    await this.reportRepository.remove(report);
  }

  async banItem(type: string, id: string): Promise<void> {
    // Normalize type to handle both enum values and lowercase
    const normalizedType = type.toLowerCase().replace('_', '-');

    if (normalizedType === 'review') {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user', 'content'],
      });
      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Update review status to BANNED instead of deleting
      review.status = REVIEW_STATUS.BANNED;
      await this.reviewRepository.save(review);

      // Update all reports for this review to APPROVED
      await this.reportRepository.update(
        { targetId: id, type: REPORT_TYPE.REVIEW },
        { status: REPORT_STATUS.APPROVED },
      );

      const userEmail = review.user.email;
      if (!userEmail) {
        throw new NotFoundException('User email not found');
      }

      const contentTitle = review.content.title || 'Unknown Content';
      const reviewContent = review.contentReviewed;

      // Send email notification
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${this.emailService['emailConfig'].fromName}</h1>
          </div>
          <div style="padding: 30px; color: #333;">
            <h2 style="margin-top: 0; color: #dc2626;">Review Banned</h2>
            <p>Dear ${review.user.name || 'User'},</p>
            <p>Your review for the content "<strong>${contentTitle}</strong>" has been banned due to violation of our community guidelines.</p>

            <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #991b1b;">Banned Review Content:</h3>
              <p style="color: #7f1d1d; font-style: italic;">"${reviewContent}"</p>
            </div>

            <p>If you believe this ban was made in error or would like to appeal, please contact our support team.</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      await this.emailService.sendEmail(userEmail, 'Review Banned', htmlContent);
    } else if (normalizedType === 'episode-review') {
      const episodeReview = await this.reviewEpisodeRepository.findOne({
        where: { id },
        relations: [
          'user',
          'episode',
          'episode.season',
          'episode.season.tvseries',
          'episode.season.tvseries.metaData',
        ],
      });
      if (!episodeReview) {
        throw new NotFoundException('Episode review not found');
      }

      // Update episode review status to BANNED instead of deleting
      episodeReview.status = REVIEW_STATUS.BANNED;
      await this.reviewEpisodeRepository.save(episodeReview);

      // Update all reports for this episode review to APPROVED
      await this.reportRepository.update(
        { targetId: id, type: REPORT_TYPE.EPISODE_REVIEW },
        { status: REPORT_STATUS.APPROVED },
      );

      const userEmail = episodeReview.user.email;
      if (!userEmail) {
        throw new NotFoundException('User email not found');
      }

      const episodeTitle = episodeReview.episode.episodeTitle || 'Unknown Episode';
      const seriesTitle =
        episodeReview.episode.season?.tvseries?.metaData?.title || 'Unknown Series';
      const reviewContent = episodeReview.contentReviewed;

      // Send email notification
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${this.emailService['emailConfig'].fromName}</h1>
          </div>
          <div style="padding: 30px; color: #333;">
            <h2 style="margin-top: 0; color: #dc2626;">Episode Review Banned</h2>
            <p>Dear ${episodeReview.user.name || 'User'},</p>
            <p>Your review for the episode "<strong>${episodeTitle}</strong>" from the series "<strong>${seriesTitle}</strong>" has been banned due to violation of our community guidelines.</p>

            <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #991b1b;">Banned Review Content:</h3>
              <p style="color: #7f1d1d; font-style: italic;">"${reviewContent}"</p>
            </div>

            <p>If you believe this ban was made in error or would like to appeal, please contact our support team.</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      await this.emailService.sendEmail(userEmail, 'Episode Review Banned', htmlContent);
    } else {
      throw new NotFoundException('Invalid type');
    }
  }

  async unbanItem(type: string, id: string): Promise<void> {
    // Normalize type to handle both enum values and lowercase
    const normalizedType = type.toLowerCase().replace('_', '-');

    if (normalizedType === 'review') {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user', 'content'],
      });
      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Update review status to ACTIVE
      review.status = REVIEW_STATUS.ACTIVE;
      await this.reviewRepository.save(review);

      const userEmail = review.user.email;
      if (!userEmail) {
        throw new NotFoundException('User email not found');
      }

      const contentTitle = review.content.title || 'Unknown Content';

      // Send email notification
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${this.emailService['emailConfig'].fromName}</h1>
          </div>
          <div style="padding: 30px; color: #333;">
            <h2 style="margin-top: 0; color: #10b981;">Review Restored</h2>
            <p>Dear ${review.user.name || 'User'},</p>
            <p>Good news! Your review for the content "<strong>${contentTitle}</strong>" has been restored and is now visible to other users.</p>

            <p>If you have any questions about this decision, please contact our support team.</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      await this.emailService.sendEmail(userEmail, 'Review Restored', htmlContent);
    } else if (normalizedType === 'episode-review') {
      const episodeReview = await this.reviewEpisodeRepository.findOne({
        where: { id },
        relations: [
          'user',
          'episode',
          'episode.season',
          'episode.season.tvseries',
          'episode.season.tvseries.metaData',
        ],
      });
      if (!episodeReview) {
        throw new NotFoundException('Episode review not found');
      }

      // Update episode review status to ACTIVE
      episodeReview.status = REVIEW_STATUS.ACTIVE;
      await this.reviewEpisodeRepository.save(episodeReview);

      const userEmail = episodeReview.user.email;
      if (!userEmail) {
        throw new NotFoundException('User email not found');
      }

      const episodeTitle = episodeReview.episode.episodeTitle || 'Unknown Episode';
      const seriesTitle =
        episodeReview.episode.season?.tvseries?.metaData?.title || 'Unknown Series';

      // Send email notification
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${this.emailService['emailConfig'].fromName}</h1>
          </div>
          <div style="padding: 30px; color: #333;">
            <h2 style="margin-top: 0; color: #10b981;">Episode Review Restored</h2>
            <p>Dear ${episodeReview.user.name || 'User'},</p>
            <p>Good news! Your review for the episode "<strong>${episodeTitle}</strong>" from the series "<strong>${seriesTitle}</strong>" has been restored and is now visible to other users.</p>

            <p>If you have any questions about this decision, please contact our support team.</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      await this.emailService.sendEmail(userEmail, 'Episode Review Restored', htmlContent);
    } else {
      throw new NotFoundException('Invalid type');
    }
  }

  async approveItem(type: string, id: string): Promise<void> {
    // Update report status to APPROVED instead of deleting
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = REPORT_STATUS.APPROVED;
    await this.reportRepository.save(report);
  }

  async rejectItem(type: string, id: string): Promise<void> {
    // Update report status to REJECTED
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = REPORT_STATUS.REJECTED;
    await this.reportRepository.save(report);
  }
}
