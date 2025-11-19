import * as fs from 'fs';
import * as path from 'path';

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('r2.accessKeyId');
    const secretAccessKey = this.configService.get('r2.secretAccessKey');
    this.bucketName = this.configService.get('r2.bucketName', '');

    // ✅ R2 endpoint format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    const endpoint = this.configService.get(
      'r2.endpoint',
      `https://${this.configService.get('r2.accountId')}.r2.cloudflarestorage.com`,
    );
    this.logger.log(`🔧 Initializing R2 client...`);
    this.logger.log(`   Endpoint: ${endpoint}`);
    this.logger.log(`   Bucket: ${this.bucketName}`);

    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.logger.log('✅ R2 client initialized');
  }

  async uploadImage(filePath: string, folder = 'thumbnails'): Promise<string> {
    try {
      const fileName = `${folder}/${Date.now()}-${filePath.split(/[\\/]/).pop()}`;
      const fileBuffer = fs.readFileSync(filePath);

      this.logger.log(`📤 Uploading to R2: ${fileName}`);
      this.logger.log(`   Bucket: ${this.bucketName}`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName, // ⚠️ Kiểm tra tên bucket
          Key: fileName,
          Body: fileBuffer,
          ContentType: 'image/png',
        },
      });

      await upload.done();

      const publicUrl = `${this.configService.get('r2.publicUrl')}/${fileName}`;
      this.logger.log(`✅ R2 upload successful: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ R2 upload failed: ${error.message}`);
      this.logger.error(`   Bucket name: ${this.bucketName}`);
      throw error;
    }
  }

  async uploadFile(
    filePath: string,
    folder = 'files',
    contentType = 'application/octet-stream',
  ): Promise<string> {
    try {
      const fileName = `${folder}/${Date.now()}-${path.basename(filePath)}`;
      const fileBuffer = fs.readFileSync(filePath);

      this.logger.log(`📤 Uploading file to R2: ${fileName}`);
      this.logger.log(`   Bucket: ${this.bucketName}`);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: contentType,
        },
      });

      await upload.done();

      const publicUrl = `${this.configService.get('r2.publicUrl')}/${fileName}`;
      this.logger.log(`✅ R2 file upload successful: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ R2 file upload failed: ${error.message}`);
      throw error;
    }
  }
}
