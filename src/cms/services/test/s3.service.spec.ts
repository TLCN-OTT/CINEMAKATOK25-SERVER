import * as fs from 'fs';
import { Readable } from 'stream';

import { getConfig } from '@app/common/utils/get-config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Upload } from '@aws-sdk/lib-storage';
import { Test, TestingModule } from '@nestjs/testing';

import { S3Service } from '../s3.service';

// --- Mocks Libraries ---
// Mock configuration to avoid loading real env vars
jest.mock('@app/common/utils/get-config', () => ({
  getConfig: jest.fn(),
}));

// Mock AWS SDKs
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');
jest.mock('@aws-sdk/cloudfront-signer');

// NOTE: We do NOT mock 'fs' globally here to avoid crashing Jest workers.
// We will use jest.spyOn(fs, ...) in specific tests.

describe('S3Service', () => {
  let service: S3Service;
  let s3ClientMock: any;

  // Typecast mocks for IntelliSense
  const mockGetConfig = getConfig as jest.Mock;
  const mockUpload = Upload as unknown as jest.Mock;
  const mockGetSignedCookies = getSignedCookies as jest.Mock;
  const mockS3Client = S3Client as unknown as jest.Mock;

  // Default values
  const defaultRegion = 'ap-southeast-1';
  const defaultBucket = 'test-bucket';
  const defaultAccessKey = 'test-access-key';
  const defaultSecretKey = 'test-secret-key';
  const defaultCloudfrontDomain = 'cdn.veezy.shop';
  const defaultKeyPairId = 'keypair-id';
  const defaultPrivateKey = 'private-key';

  //

  // [Image of Unit Test Setup Diagram]
  //  - Visualizing the mock injection flow
  const setupService = async (
    configOverrides: {
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
    } = {},
  ) => {
    jest.clearAllMocks();

    // 1. Mock getConfig Implementation
    mockGetConfig.mockImplementation((key: string, defaultValue: any) => {
      switch (key) {
        case 'aws.region':
          return defaultRegion;
        case 'aws.bucketName':
          return configOverrides.bucket !== undefined ? configOverrides.bucket : defaultBucket;
        case 'aws.accessKeyId':
          return configOverrides.accessKey !== undefined
            ? configOverrides.accessKey
            : defaultAccessKey;
        case 'aws.secretAccessKey':
          return configOverrides.secretKey !== undefined
            ? configOverrides.secretKey
            : defaultSecretKey;
        case 'aws.cloudfrontDomain':
          return defaultCloudfrontDomain;
        case 'aws.cloudfrontKeyPairId':
          return defaultKeyPairId;
        case 'aws.cloudfrontPrivateKey':
          return defaultPrivateKey;
        default:
          return defaultValue;
      }
    });

    // 2. Mock S3Client
    s3ClientMock = {
      send: jest.fn(),
    };
    mockS3Client.mockImplementation(() => s3ClientMock);

    // 3. Mock Upload (Default safe implementation to avoid undefined crashes)
    const defaultUploadMock = {
      on: jest.fn().mockReturnThis(), // Allow chaining
      done: jest.fn().mockResolvedValue({
        ETag: 'default-etag',
        Location: 'default-location',
      }),
    };
    mockUpload.mockImplementation(() => defaultUploadMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    return module.get<S3Service>(S3Service);
  };

  // Cleanup spies after each test to prevent side effects
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. Test Constructor & Config
  // =================================================================
  describe('Constructor', () => {
    it('should initialize successfully with valid config', async () => {
      service = await setupService();
      expect(service).toBeDefined();
      expect(mockS3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: defaultRegion,
          credentials: {
            accessKeyId: defaultAccessKey,
            secretAccessKey: defaultSecretKey,
          },
        }),
      );
    });

    it('should throw error if bucket name is missing', async () => {
      await expect(setupService({ bucket: '' })).rejects.toThrow('AWS_S3_BUCKET_NAME is required');
    });

    it('should throw error if credentials are missing', async () => {
      await expect(setupService({ accessKey: '' })).rejects.toThrow(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required',
      );
    });
  });

  // =================================================================
  // 2. Test uploadLargeFile
  // =================================================================
  describe('uploadLargeFile', () => {
    let mockFile: Express.Multer.File;
    const mockKey = 'videos/test.mp4';
    const mockETag = 'test-etag';
    const mockLocation = 'https://s3-location.com/file';

    beforeEach(async () => {
      service = await setupService();
      mockFile = {
        originalname: 'test.mp4',
        mimetype: 'video/mp4',
        path: '/tmp/test.mp4',
        size: 1024 * 1024 * 5,
      } as Express.Multer.File;
    });

    it('should throw error if file is invalid', async () => {
      await expect(service.uploadLargeFile(null as any, mockKey)).rejects.toThrow(
        'Invalid file provided',
      );
    });

    it('should upload successfully, log progress, and delete temp file', async () => {
      // Mock FS
      jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      // Mock Upload Success
      const uploadMock = {
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'httpUploadProgress') cb({ loaded: 50, total: 100 });
          return uploadMock;
        }),
        done: jest.fn().mockResolvedValue({
          ETag: mockETag,
          Location: mockLocation,
        }),
      };
      mockUpload.mockImplementation(() => uploadMock);

      const result = await service.uploadLargeFile(mockFile, mockKey);

      expect(mockUpload).toHaveBeenCalledTimes(1);
      // Verify progress log was attempted (via callback execution)
      expect(uploadMock.on).toHaveBeenCalledWith('httpUploadProgress', expect.any(Function));
      // Verify temp file deletion
      expect(unlinkSyncSpy).toHaveBeenCalledWith(mockFile.path);
      // Verify output
      expect(result).toEqual({
        key: mockKey,
        bucket: defaultBucket,
        url: expect.stringContaining(mockKey),
        etag: mockETag,
        location: mockLocation,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
      });
    });

    it('should handle temp file deletion error (Sync) gracefully', async () => {
      // Scenario: Upload succeeds, but cleaning up temp file fails
      jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock unlinkSync throwing error
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Upload succeeds
      mockUpload.mockImplementation(() => ({
        on: jest.fn().mockReturnThis(),
        done: jest.fn().mockResolvedValue({ ETag: 'ok', Location: 'ok' }),
      }));

      // Should not throw; specific error should be logged but process continues
      await expect(service.uploadLargeFile(mockFile, mockKey)).resolves.toBeDefined();
    });

    it('should handle upload failure and attempt async cleanup', async () => {
      jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock Upload Failure
      mockUpload.mockImplementation(() => ({
        on: jest.fn().mockReturnThis(),
        done: jest.fn().mockRejectedValue(new Error('S3 Error')),
      }));

      // Mock async unlink for cleanup
      const unlinkSpy = jest.spyOn(fs, 'unlink').mockImplementation((path, cb) => cb(null));

      await expect(service.uploadLargeFile(mockFile, mockKey)).rejects.toThrow(
        'Failed to upload to S3: S3 Error',
      );

      // Ensure cleanup was called
      expect(unlinkSpy).toHaveBeenCalledWith(mockFile.path, expect.any(Function));
    });

    it('should handle async cleanup failure gracefully', async () => {
      jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock Upload Failure
      mockUpload.mockImplementation(() => ({
        on: jest.fn().mockReturnThis(),
        done: jest.fn().mockRejectedValue(new Error('S3 Error')),
      }));

      // Mock unlink failing
      jest.spyOn(fs, 'unlink').mockImplementation((path, cb) => cb(new Error('Unlink failed')));

      // Expect the original S3 error, ignoring the unlink error
      await expect(service.uploadLargeFile(mockFile, mockKey)).rejects.toThrow(
        'Failed to upload to S3: S3 Error',
      );
    });
  });

  // =================================================================
  // 3. Test deleteFile
  // =================================================================
  describe('deleteFile', () => {
    beforeEach(async () => {
      service = await setupService();
    });

    it('should delete file successfully', async () => {
      s3ClientMock.send.mockResolvedValue({});
      const result = await service.deleteFile('test-key');
      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
      expect(result).toEqual({ success: true, key: 'test-key' });
    });

    it('should throw error if S3 deletion fails', async () => {
      s3ClientMock.send.mockRejectedValue(new Error('Network error'));
      await expect(service.deleteFile('test-key')).rejects.toThrow(
        'Failed to delete from S3: Network error',
      );
    });
  });

  // =================================================================
  // 4. Test getSignedCookiesForFile
  // =================================================================
  describe('getSignedCookiesForFile', () => {
    beforeEach(async () => {
      service = await setupService();
    });

    it('should return signed cookies and url', async () => {
      mockGetSignedCookies.mockReturnValue({
        'CloudFront-Key-Pair-Id': 'key-id',
        'CloudFront-Policy': 'policy',
        'CloudFront-Signature': 'signature',
      });
      const defaultCloudfrontDomain1 = 'cdn.veezy.shop';

      const s3Key = 'videos/master.m3u8';
      const result = await service.getSignedCookiesForFile(s3Key);

      expect(mockGetSignedCookies).toHaveBeenCalledTimes(1);
    });
  });
});
