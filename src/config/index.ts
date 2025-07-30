import * as Joi from 'joi';
import appConfig from './app.config';
import databaseConfig from './database.config';
import emailConfig from './email.config';
import screenshotConfig from './screenshot.config';

const validationSchema = Joi.object({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  APP_URL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  WIDGET_URL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  AUTH_SECRET: Joi.string().required(),
  AUTH_TOKEN_EXPIRES_IN: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  SCREENSHOT_BASE_DIR: Joi.string().required(),
  SCREENSHOT_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
});

export type Config = {
  app: ReturnType<typeof appConfig>;
  database: ReturnType<typeof databaseConfig>;
  email: ReturnType<typeof emailConfig>;
  screenshot: ReturnType<typeof screenshotConfig>;
};

export {
  appConfig,
  databaseConfig,
  emailConfig,
  screenshotConfig,
  validationSchema,
};
