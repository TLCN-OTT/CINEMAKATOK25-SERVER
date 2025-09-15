import { Entity, Repository } from 'typeorm';

import { ERROR_CODE } from '@app/common/constants/global.constants';
import { PasswordHash } from '@app/common/utils/hash';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { EntityUser } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(EntityUser)
    private readonly userRepository: Repository<EntityUser>,
  ) {}
  async findById(id: string) {
    // Logic to find a user by ID
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({ code: ERROR_CODE.ENTITY_NOT_FOUND });
    }
    return user;
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
    return await this.userRepository.save(user);
  }

  async delete(id: string) {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  private async existsByEmail(email: string): Promise<boolean> {
    return await this.userRepository.existsBy({ email: email.toLowerCase() });
  }
}
