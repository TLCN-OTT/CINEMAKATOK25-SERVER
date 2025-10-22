import { CmsModule } from 'src/cms/cms.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewController } from './controller/review.controller';
import { EntityReview } from './entities/review.entity';
import { ReviewService } from './services/review.service';

@Module({
  imports: [TypeOrmModule.forFeature([EntityReview]), CmsModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class PepModule {}
