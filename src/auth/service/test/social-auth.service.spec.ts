import { AxiosService } from '@app/core/axios/axios.service';
import { Test, TestingModule } from '@nestjs/testing';

import { SocialAuthService } from '../social-auth.service';

describe('SocialAuthService', () => {
  let service: SocialAuthService;
  let axiosService: AxiosService;

  const mockGoogleUser = {
    id: 'google-123',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    picture: 'https://example.com/avatar.jpg',
  };

  const mockFacebookUser = {
    id: 'facebook-456',
    name: 'Jane Smith',
    email: 'jane.smith@facebook.com',
    picture: { data: { url: 'https://example.com/fb-avatar.jpg' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAuthService,
        {
          provide: AxiosService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SocialAuthService>(SocialAuthService);
    axiosService = module.get<AxiosService>(AxiosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyGoogleToken', () => {
    it('should verify Google token successfully', async () => {
      jest.spyOn(axiosService, 'get').mockResolvedValue(mockGoogleUser);

      const result = await service.verifyGoogleToken('valid-google-token');

      expect(result).toEqual({
        id: mockGoogleUser.id,
        name: mockGoogleUser.name,
        email: mockGoogleUser.email,
        picture: mockGoogleUser.picture,
      });
      expect(axiosService.get).toHaveBeenCalledWith(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=valid-google-token`,
      );
    });

    it('should throw error for invalid Google token', async () => {
      jest.spyOn(axiosService, 'get').mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyGoogleToken('invalid-token')).rejects.toThrow(
        'Invalid Google access token',
      );
    });

    it('should handle network errors', async () => {
      jest.spyOn(axiosService, 'get').mockRejectedValue(new Error('Network error'));

      await expect(service.verifyGoogleToken('token')).rejects.toThrow(
        'Invalid Google access token',
      );
    });
  });

  describe('verifyFacebookToken', () => {
    it('should verify Facebook token successfully', async () => {
      jest.spyOn(axiosService, 'get').mockResolvedValue(mockFacebookUser);

      const result = await service.verifyFacebookToken('valid-facebook-token');

      expect(result).toEqual({
        id: mockFacebookUser.id,
        name: mockFacebookUser.name,
        email: mockFacebookUser.email,
        picture: mockFacebookUser.picture.data.url,
      });
      expect(axiosService.get).toHaveBeenCalledWith(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=valid-facebook-token`,
      );
    });

    it('should handle Facebook user without email', async () => {
      const facebookUserWithoutEmail = {
        ...mockFacebookUser,
        email: undefined,
      };
      jest.spyOn(axiosService, 'get').mockResolvedValue(facebookUserWithoutEmail);

      const result = await service.verifyFacebookToken('token');

      expect(result.email).toBeNull();
    });

    it('should throw error for invalid Facebook token', async () => {
      jest.spyOn(axiosService, 'get').mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyFacebookToken('invalid-token')).rejects.toThrow(
        'Invalid Facebook access token',
      );
    });
  });

  describe('verifySocialToken', () => {
    it('should verify Google token via generic method', async () => {
      jest.spyOn(axiosService, 'get').mockResolvedValue(mockGoogleUser);

      const result = await service.verifySocialToken('google', 'valid-token');

      expect(result).toEqual({
        id: mockGoogleUser.id,
        name: mockGoogleUser.name,
        email: mockGoogleUser.email,
        picture: mockGoogleUser.picture,
      });
    });

    it('should verify Facebook token via generic method', async () => {
      jest.spyOn(axiosService, 'get').mockResolvedValue(mockFacebookUser);

      const result = await service.verifySocialToken('facebook', 'valid-token');

      expect(result).toEqual({
        id: mockFacebookUser.id,
        name: mockFacebookUser.name,
        email: mockFacebookUser.email,
        picture: mockFacebookUser.picture.data.url,
      });
    });

    it('should throw error for unsupported provider', async () => {
      await expect(service.verifySocialToken('twitter' as any, 'token')).rejects.toThrow(
        'Unsupported social provider',
      );
    });
  });
});
