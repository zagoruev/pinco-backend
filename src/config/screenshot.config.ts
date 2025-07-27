import { registerAs } from '@nestjs/config';

export default registerAs('screenshot', () => ({
  baseDir: process.env.SCREENSHOT_BASE_DIR || './screenshots',
  baseUrl:
    process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000/screenshots',
}));
