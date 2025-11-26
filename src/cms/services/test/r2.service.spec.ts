import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { R2StorageService } from '../r2.service';

describe('R2StorageService', () => {
  let service: R2StorageService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        R2StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'r2.accessKeyId': 'test-key',
                'r2.secretAccessKey': 'test-secret',
                'r2.bucketName': 'test-bucket',
                'r2.accountId': 'test-account',
                'r2.endpoint': 'https://test.r2.cloudflarestorage.com',
                'r2.publicUrl': 'https://test.r2.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<R2StorageService>(R2StorageService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image', async () => {
      const mockUpload = {
        done: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(require('@aws-sdk/lib-storage'), 'Upload').mockImplementation(() => mockUpload);
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(Buffer.from('test'));

      const result = await service.uploadImage('/path/to/image.jpg');

      expect(result).toContain('https://test.r2.com');
    });
  });

  describe('uploadFile', () => {
    it('should upload file', async () => {
      const mockUpload = {
        done: jest.fn().mockResolvedValue({}),
      };
      jest.spyOn(require('@aws-sdk/lib-storage'), 'Upload').mockImplementation(() => mockUpload);
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(Buffer.from('test'));

      const result = await service.uploadFile('/path/to/file.jpg');

      expect(result).toContain('https://test.r2.com');
    });
  });
});
