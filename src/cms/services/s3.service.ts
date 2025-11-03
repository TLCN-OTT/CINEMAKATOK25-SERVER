import * as fs from 'fs';
import { get } from 'node_modules/axios/index.cjs';
import * as path from 'path';

import { getConfig } from '@app/common/utils/get-config';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';

const cloudfrontDistributionDomain = getConfig(
  'aws.cloudfrontDomain',
  '<YOUR_CLOUDFRONT_DOMAIN_HERE>',
);

const KEYPAIR_ID = getConfig('aws.cloudfrontKeyPairId', '<YOUR_KEYPAIR_ID_HERE>');

export interface CookiesData {
  [key: string]: {
    value: string;
    options?: object;
  };
}

/**
 * This does not work on localhost
 */
const cookiesOptions = {
  domain: 'veezy.shop',
  secure: true,
  path: '/',
  sameSite: 'none',
};
// // This works on localhost (for development)
// const cookiesOptions = {
//   // domain: 'mpcsj.online',
//   domain: 'localhost',
//   secure: false,
//   path: '/',
//   sameSite: 'lax',
// };

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    // ✅ Lấy config với fallback và log
    this.region = getConfig('aws.region', 'ap-southeast-1');
    this.bucketName = getConfig('aws.bucketName', '');
    const accessKeyId = getConfig('aws.accessKeyId', '');
    const secretAccessKey = getConfig('aws.secretAccessKey', '');

    // ✅ Log configuration (không log sensitive data)
    this.logger.log('🔧 S3 Configuration:');
    this.logger.log(`   Region: ${this.region}`);
    this.logger.log(`   Bucket: ${this.bucketName || '❌ NOT SET'}`);
    this.logger.log(`   Access Key: ${accessKeyId ? '✅ SET' : '❌ NOT SET'}`);
    this.logger.log(`   Secret Key: ${secretAccessKey ? '✅ SET' : '❌ NOT SET'}`);

    // ✅ Validate required fields
    if (!this.bucketName) {
      this.logger.error('❌ AWS_S3_BUCKET_NAME is not configured!');
      throw new Error('AWS_S3_BUCKET_NAME is required for S3 operations');
    }

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('❌ AWS credentials are not configured!');
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required');
    }

    // ✅ Initialize S3 Client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('✅ S3 Client initialized successfully');
  }

  async uploadLargeFile(file: Express.Multer.File, key: string) {
    if (!file || !file.path) {
      throw new Error('Invalid file provided');
    }

    this.logger.log(`📤 Starting upload: ${file.originalname}`);
    this.logger.log(`   File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    this.logger.log(`   MIME type: ${file.mimetype}`);

    try {
      // ✅ Read file stream
      const fileStream = fs.createReadStream(file.path);

      // ✅ Handle stream errors
      fileStream.on('error', error => {
        this.logger.error(`❌ File stream error: ${error.message}`);
        throw error;
      });

      // ✅ Upload to S3
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileStream,
          ContentType: file.mimetype,
          // ACL: 'public-read', // Uncomment nếu muốn public
        },
        partSize: 10 * 1024 * 1024, // 10MB per part
        queueSize: 5, // 5 concurrent uploads
        leavePartsOnError: false,
      });

      // ✅ Track progress
      upload.on('httpUploadProgress', progress => {
        if (progress.loaded && progress.total) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
          this.logger.log(`📊 Upload progress: ${percent}%`);
        }
      });

      // ✅ Wait for upload completion
      const result = await upload.done();

      this.logger.log('✅ Upload completed successfully');

      // ✅ Delete temp file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          this.logger.log(`🗑️  Temp file deleted: ${file.path}`);
        }
      } catch (err) {
        this.logger.warn(`⚠️  Cannot delete temp file: ${err.message}`);
      }

      // ✅ Return result
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        key,
        bucket: this.bucketName,
        url,
        etag: result.ETag,
        location: result.Location,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`❌ Upload failed: ${error.message}`, error.stack);

      // ✅ Clean up temp file on error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, err => {
          if (err) this.logger.error(`Failed to delete temp file: ${err.message}`);
        });
      }

      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  async deleteFile(key: string) {
    try {
      this.logger.log(`🗑️  Deleting file from S3: ${key}`);

      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log('✅ File deleted successfully');
      return { success: true, key };
    } catch (error) {
      this.logger.error(`❌ Delete failed: ${error.message}`, error.stack);
      throw new Error(`Failed to delete from S3: ${error.message}`);
    }
  }

  async getSignedCookiesForFile(s3FileKey: string) {
    const url = `${cloudfrontDistributionDomain}/${encodeURI(s3FileKey)}`; // master .m3u8 file (HLS playlist)
    const privateKey = getConfig('aws.cloudfrontPrivateKey', '');

    const intervalToAddInMs = 86400 * 1000;
    const policy = {
      Statement: [
        {
          Resource: `https://${cloudfrontDistributionDomain}/*`,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor((Date.now() + intervalToAddInMs) / 1000),
            },
          },
        },
      ],
    };

    const policyString = JSON.stringify(policy);
    const cookies = getSignedCookies({
      keyPairId: KEYPAIR_ID,
      privateKey,
      policy: policyString,
    });

    const cookiesResult: CookiesData = {};
    Object.keys(cookies).forEach(key => {
      cookiesResult[key] = {
        value: cookies[key],
        options: cookiesOptions,
      };
    });

    return {
      fileUrl: `https://${url}`, // master playlist url
      cookies: cookiesResult, // cookies for frontend
    };
  }
}
