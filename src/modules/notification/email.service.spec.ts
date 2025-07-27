import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'email.host': 'smtp.test.com',
                'email.port': 587,
                'email.secure': false,
                'email.user': 'test@test.com',
                'email.pass': 'password',
                'email.from': 'noreply@pinco.com',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'password',
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@pinco.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test HTML content',
      });
    });

    it('should use provided text if available', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Custom text content',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@pinco.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Custom text content',
      });
    });

    it('should strip HTML tags for text version', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<h1>Title</h1><p>Paragraph <strong>bold</strong> text</p>',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@pinco.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<h1>Title</h1><p>Paragraph <strong>bold</strong> text</p>',
        text: 'TitleParagraph bold text',
      });
    });
  });
});
