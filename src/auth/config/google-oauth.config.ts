import { getConfig } from '@app/common/utils/get-config';
import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
  clientID: getConfig('google.clientID', 'your_google_client_id'),
  clientSecret: getConfig('google.clientSecret', 'your_google_client_secret'),
  callbackURL: getConfig('google.callbackURL', 'your_google_callback_url'),
}));
