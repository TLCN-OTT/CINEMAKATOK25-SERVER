// src/audit-log/audit-log.module.ts
import { CmsModule } from 'src/cms/cms.module';

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogController } from './controller/audit-log.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './service/audit-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), CmsModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
