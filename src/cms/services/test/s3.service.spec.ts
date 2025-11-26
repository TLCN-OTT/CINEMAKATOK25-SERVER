import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Test, TestingModule } from '@nestjs/testing';

import { S3Service } from '../s3.service';

// Mock getConfig
jest.mock('@app/common/utils/get-config', () => ({
  getConfig: jest.fn((path: string, defaultValue: any) => {
    const mockValues: Record<string, any> = {
      'aws.region': 'ap-southeast-1',
      'aws.bucketName': 'cinemakatok25',
      'aws.accessKeyId': 'test-key',
      'aws.secretAccessKey': 'test-secret',
    };
    return mockValues[path] || defaultValue;
  }),
}));

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);

    jest.clearAllMocks();
  });

  describe('uploadLargeFile', () => {
    it('should upload large file', async () => {
      const mockFile = {
        path: '/path/to/file.jpg',
        originalname: 'file.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
      };

      const mockUpload = {
        done: jest.fn().mockResolvedValue({
          ETag: '"etag123"',
          Location: 'https://cinemakatok25.s3.ap-southeast-1.amazonaws.com/file.jpg',
        }),
        on: jest.fn(),
      };

      jest.spyOn(require('@aws-sdk/lib-storage'), 'Upload').mockImplementation(() => mockUpload);
      jest.spyOn(require('fs'), 'createReadStream').mockReturnValue({ on: jest.fn() } as any);

      const result = await service.uploadLargeFile(mockFile as any, 'file.jpg');

      expect(result.url).toContain('cinemakatok25.s3.ap-southeast-1.amazonaws.com');
      expect(result.key).toBe('file.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const mockDeleteObject = {};
      jest
        .spyOn(service['s3Client'], 'send')
        .mockImplementation(() => Promise.resolve(mockDeleteObject));

      const result = await service.deleteFile('file.jpg');

      expect(service['s3Client'].send).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getSignedCookiesForFile', () => {
    it('should get signed cookies for file', async () => {
      const mockCookies = { 'CloudFront-Key-Pair-Id': { value: 'key', options: {} } };
      jest
        .spyOn(require('@aws-sdk/cloudfront-signer'), 'getSignedCookies')
        .mockReturnValue(mockCookies);

      const result = await service.getSignedCookiesForFile('file.jpg');

      expect(result.cookies).toBeDefined();
      expect(result.fileUrl).toContain('file.jpg');
    });
  });
});
