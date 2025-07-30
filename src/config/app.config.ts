import { registerAs } from '@nestjs/config';
import ms, { StringValue } from 'ms';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT!, 10),
  url: process.env.APP_URL!,
  apiPrefix: process.env.API_PREFIX!,
  authSecret: process.env.AUTH_SECRET!,
  authTokenExpiresIn: ms(process.env.AUTH_TOKEN_EXPIRES_IN as StringValue),
}));
