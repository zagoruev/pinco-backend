import { registerAs } from '@nestjs/config';
import parse from 'parse-duration';

export default registerAs('app', () => ({
  isDev: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT!, 10),
  url: process.env.APP_URL!,
  apiPrefix: process.env.API_PREFIX!,
  authSecret: process.env.AUTH_SECRET!,
  authTokenExpiresIn: parse(process.env.AUTH_TOKEN_EXPIRES_IN)!,
  widgetUrl: process.env.WIDGET_URL!,
  widgetDevUrl: process.env.WIDGET_DEV_URL,
  widgetIsDev:
    process.env.WIDGET_IS_DEV === 'true' && process.env.WIDGET_DEV_URL,
}));
