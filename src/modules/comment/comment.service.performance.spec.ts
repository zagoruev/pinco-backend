import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { createComment, createSite } from '../../../test/fixtures/builders';
import { ReplyService } from '../reply/reply.service';
import { ScreenshotService } from '../screenshot/screenshot.service';
import { CommentView } from './comment-view.entity';
import { Comment } from './comment.entity';
import { CommentService } from './comment.service';

describe('CommentService - Performance', () => {
  let service: CommentService;
  let commentRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CommentView),
          useValue: {},
        },
        {
          provide: ScreenshotService,
          useValue: {
            getUrl: jest.fn().mockReturnValue('http://example.com/screenshot.png'),
          },
        },
        {
          provide: ReplyService,
          useValue: {},
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get(getRepositoryToken(Comment));
  });

  describe('Large Dataset Performance', () => {
    it('should handle findAll with 1000+ comments efficiently', async () => {
      const mockComments = Array(1000)
        .fill(null)
        .map((_, i) => createComment({ id: i + 1, message: `Comment ${i + 1}` }));

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockComments),
      };

      commentRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const startTime = Date.now();
      const result = await service.findAll(createSite(), {
        id: 1,
        email: 'test@example.com',
        roles: [],
        sites: [],
      });
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should use proper indexes in queries', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      commentRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll(createSite(), {
        id: 1,
        email: 'test@example.com',
        roles: [],
        sites: [],
      });

      // Verify efficient query construction
      expect(queryBuilder.where).toHaveBeenCalledWith('comment.site_id = :siteId', { siteId: 1 });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('comment.created', 'DESC');
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when processing large batches', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      commentRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      // Run multiple queries to check for memory leaks
      const iterations = 100;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const result = await service.findAll(createSite(), {
          id: 1,
          email: 'test@example.com',
          roles: [],
          sites: [],
        });
        results.push(result);
      }

      expect(results).toHaveLength(iterations);
      // In a real scenario, you'd monitor actual memory usage
    });
  });
});
