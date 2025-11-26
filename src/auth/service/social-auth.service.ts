import { AxiosService } from '@app/core/axios/axios.service';
import { Injectable } from '@nestjs/common';

interface SocialUserInfo {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

@Injectable()
export class SocialAuthService {
  constructor(private readonly axiosService: AxiosService) {}

  /**
   * Verify Google access token and get user info
   */
  async verifyGoogleToken(accessToken: string): Promise<SocialUserInfo> {
    try {
      const response = await this.axiosService.get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
      );
      const userData = response as any;

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
      };
    } catch (error) {
      throw new Error('Invalid Google access token');
    }
  }

  /**
   * Verify Facebook access token and get user info
   */
  async verifyFacebookToken(accessToken: string): Promise<SocialUserInfo> {
    try {
      const response = await this.axiosService.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      );
      const userData = response as any;

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email ?? null,
        picture: userData.picture?.data?.url,
      };
    } catch (error) {
      throw new Error('Invalid Facebook access token');
    }
  }

  /**
   * Generic method to verify social token
   */
  async verifySocialToken(
    provider: 'google' | 'facebook',
    accessToken: string,
  ): Promise<SocialUserInfo> {
    switch (provider) {
      case 'google':
        return await this.verifyGoogleToken(accessToken);
      case 'facebook':
        return await this.verifyFacebookToken(accessToken);
      default:
        throw new Error('Unsupported social provider');
    }
  }
}
