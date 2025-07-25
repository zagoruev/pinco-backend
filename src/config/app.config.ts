import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  cookieSecret: process.env.COOKIE_SECRET || 'default-secret',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
}));