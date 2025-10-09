import { Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { EntityCategory } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(EntityCategory)
    private readonly categoryRepository: Repository<EntityCategory>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<EntityCategory> {
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<EntityCategory[]> {
    return await this.categoryRepository.find({
      relations: ['contents'],
    });
  }

  async findOne(id: string): Promise<EntityCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['contents'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<EntityCategory> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async search(query: string): Promise<EntityCategory[]> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.contents', 'contents')
      .where(
        `
        category.categoryName ILIKE :likeQuery 
        OR similarity(category.categoryName, :query) > 0.3
        `,
        { likeQuery: `%${query}%`, query },
      )
      .orderBy('similarity(category.categoryName, :query)', 'DESC')
      .getMany();
  }
}
