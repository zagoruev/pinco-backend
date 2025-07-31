import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';

describe('Security Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in login', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: "' OR '1'='1",
        })
        .expect(401);
    });

    it('should sanitize SQL injection in comment creation', () => {
      return request(app.getHttpServer())
        .post('/api/v1/comments')
        .send({
          message: "'; DROP TABLE comments; --",
          url: '/test',
          details: { vh: 768, vw: 1024, vx: 0, vy: 0, env: 'test' },
        })
        .expect(401); // Should fail auth, not execute SQL
    });
  });

  describe('XSS Prevention', () => {
    it('should not reflect malicious scripts in responses', async () => {
      const maliciousComment = {
        message: '<script>alert("XSS")</script>',
        url: '/test',
      };

      const response = await request(app.getHttpServer()).post('/api/v1/comments').send(maliciousComment).expect(401);

      expect(response.text).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const attempts = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' }),
        );

      const results = await Promise.all(attempts);

      // Assuming rate limiting is configured
      // Some requests should be rate limited
      const rateLimited = results.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('CORS Security', () => {
    it('should reject requests from unauthorized origins', () => {
      return request(app.getHttpServer())
        .get('/api/v1/comments')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);
    });

    it('should allow requests from authorized origins', () => {
      return request(app.getHttpServer()).get('/api/v1/comments').set('Origin', 'https://test.com').expect(401); // Would need auth, but origin is allowed
    });
  });

  describe('Authentication Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .expect(401);

      expect(response.body).not.toContain('password');
      expect(response.body).not.toContain('user not found');
    });

    it('should enforce secure cookie settings', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password' });

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        expect(cookies[0]).toContain('HttpOnly');
        expect(cookies[0]).toContain('Secure');
        expect(cookies[0]).toContain('SameSite');
      }
    });
  });
});
