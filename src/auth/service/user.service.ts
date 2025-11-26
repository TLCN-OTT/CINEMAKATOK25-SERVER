import { AuditLogService } from 'src/audit-log/service/audit-log.service';

import { Entity, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { LOG_ACTION } from '@app/common/enums/log.enum';
import { PaginationQueryDto } from '@app/common/utils/dto/pagination-query.dto';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BanUserDto, CreateUserDto, UpdateUserDto, UpdateUserInfoDto } from '../dtos/user.dto';
import { EntityUser } from '../entities/user.entity';
import { EmailService } from './email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
  ) {}
  async findById(id: string) {
    // Logic to find a user by ID
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({ code: ERROR_CODE.ENTITY_NOT_FOUND });
    }
    return user;
  }

  async findAll(query: PaginationQueryDto, search?: string) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Add fuzzy search filter if provided
    if (search && search.trim()) {
      // Search in name (fuzzy + substring) and email (substring only)
      // Name: uses pg_trgm fuzzy search + ILIKE substring match for better Vietnamese support
      // Email: uses ILIKE for exact/partial email matching
      queryBuilder.where(
        `(user.name % :search OR LOWER(user.name) ILIKE LOWER(:namePattern) OR LOWER(user.email) ILIKE LOWER(:emailPattern))`,
        {
          search: search.trim(),
          namePattern: `%${search.trim()}%`,
          emailPattern: `%${search.trim()}%`,
        },
      );
    }

    // Add sorting
    if (query.sort) {
      const sortObj = typeof query.sort === 'string' ? JSON.parse(query.sort) : query.sort;
      Object.entries(sortObj).forEach(([key, order]) => {
        queryBuilder.addOrderBy(`user.${key}`, order as 'ASC' | 'DESC');
      });
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total };
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new NotFoundException({ code: ERROR_CODE.ENTITY_NOT_FOUND });
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    if (await this.existsByEmail(createUserDto.email)) {
      throw new BadRequestException({ code: ERROR_CODE.ALREADY_EXISTS });
    }
    return await this.userRepository.save({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: PasswordHash.hashPassword('123455'),
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (user.email !== updateUserDto.email && (await this.existsByEmail(updateUserDto.email))) {
      throw new BadRequestException({ code: ERROR_CODE.ALREADY_EXISTS });
    }

    // Update user properties
    Object.assign(user, updateUserDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_USER,
      userId: user.id,
      description: `User ${user.email} updated their profile`,
    });
    return await this.userRepository.save(user);
  }

  async delete(id: string) {
    const user = await this.findById(id);
    await this.auditLogService.log({
      action: LOG_ACTION.DELETE_USER,
      userId: user.id,
      description: `User ${user.email} was deleted`,
    });
    await this.userRepository.remove(user);
  }

  private async existsByEmail(email: string): Promise<boolean> {
    return await this.userRepository.existsBy({ email: email.toLowerCase() });
  }

  /**
   * Ban user with reason and duration
   */
  async banUser(id: string, banUserDto: BanUserDto): Promise<EntityUser> {
    const user = await this.findById(id);

    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + banUserDto.durationDays);

    Object.assign(user, {
      isBanned: true,
      banReason: banUserDto.banReason,
      bannedUntil,
    });

    const savedUser = await this.userRepository.save(user);
    await this.auditLogService.log({
      action: LOG_ACTION.USER_BAN,
      userId: user.id,
      description: `User ${user.email} was banned for reason: ${banUserDto.banReason}, until: ${bannedUntil.toISOString()}`,
    });

    // Send ban notification email
    if (user.email) {
      try {
        await this.emailService.sendUserBanNotification(
          user.email,
          user.name,
          banUserDto.banReason,
          bannedUntil,
        );
      } catch (error) {
        // Log error but don't fail the ban operation
      }
    }

    return savedUser;
  }

  /**
   * Unban user
   */
  async unbanUser(id: string): Promise<EntityUser> {
    const user = await this.findById(id);

    Object.assign(user, {
      isBanned: false,
      banReason: null,
      bannedUntil: null,
    });
    await this.auditLogService.log({
      action: LOG_ACTION.USER_UNBAN,
      userId: user.id,
      description: `User ${user.email} was unbanned`,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Get user detail by ID (for admin)
   */
  async getUserDetail(id: string): Promise<EntityUser> {
    const user = await this.findById(id);
    return user;
  }

  /**
   * Update user info (for admin)
   */
  async updateUserInfo(id: string, updateUserInfoDto: UpdateUserInfoDto): Promise<EntityUser> {
    const user = await this.findById(id);

    if (updateUserInfoDto.email && user.email !== updateUserInfoDto.email) {
      if (await this.existsByEmail(updateUserInfoDto.email)) {
        throw new BadRequestException({ code: ERROR_CODE.ALREADY_EXISTS });
      }
    }

    Object.assign(user, updateUserInfoDto);
    await this.auditLogService.log({
      action: LOG_ACTION.UPDATE_USER,
      userId: user.id,
      description: `Admin updated user ${user.email} info`,
    });
    return await this.userRepository.save(user);
  }

  /**
   * Auto unban users whose ban period has expired
   */
  async unbanExpiredUsers(): Promise<number> {
    const now = new Date();

    // Find all banned users whose bannedUntil has passed
    const expiredBannedUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isBanned = :isBanned', { isBanned: true })
      .andWhere('user.bannedUntil IS NOT NULL')
      .andWhere('user.bannedUntil <= :now', { now })
      .getMany();

    if (expiredBannedUsers.length === 0) {
      return 0;
    }

    // Unban expired users
    for (const user of expiredBannedUsers) {
      Object.assign(user, {
        isBanned: false,
        banReason: null,
        bannedUntil: null,
      });
      await this.userRepository.save(user);
      await this.auditLogService.log({
        action: LOG_ACTION.USER_UNBAN,
        userId: user.id,
        description: `User ${user.email} was auto-unbanned after ban period expired`,
      });
    }

    return expiredBannedUsers.length;
  }
}
