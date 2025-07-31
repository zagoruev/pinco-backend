import { Comment, COMMENT_PREFIX } from './comment.entity';
import { CommentView } from './comment-view.entity';
import { plainToInstance } from 'class-transformer';

describe('Comment Entity', () => {
  describe('Comment Prefix', () => {
    it('should have correct prefix', () => {
      expect(COMMENT_PREFIX).toBe('c-');
    });
  });

  describe('Comment structure', () => {
    it('should create comment instance', () => {
      const comment = new Comment();
      comment.id = 1;
      comment.uniqid = 'test123';
      comment.message = 'Test comment';
      comment.user_id = 1;
      comment.site_id = 1;
      comment.url = '/test';
      comment.resolved = false;
      comment.created = new Date();
      comment.updated = new Date();

      expect(comment.id).toBe(1);
      expect(comment.uniqid).toBe('test123');
      expect(comment.message).toBe('Test comment');
      expect(comment.resolved).toBe(false);
    });
  });

  describe('viewed getter', () => {
    it('should return null when no views', () => {
      const comment = new Comment();
      comment.user_id = 1;
      comment.views = [];

      expect(comment.viewed).toBeNull();
    });

    it('should return null when views is undefined', () => {
      const comment = new Comment();
      comment.user_id = 1;
      comment.views = undefined as any;

      expect(comment.viewed).toBeNull();
    });

    it('should return viewed date when user has viewed the comment', () => {
      const viewedDate = new Date('2024-01-01');
      const comment = new Comment();
      comment.user_id = 1;

      const view = new CommentView();
      view.user_id = 1;
      view.comment_id = 1;
      view.viewed = viewedDate;

      comment.views = [view];

      expect(comment.viewed).toBe(viewedDate);
    });

    it('should return null when different user viewed the comment', () => {
      const comment = new Comment();
      comment.user_id = 1;

      const view = new CommentView();
      view.user_id = 2;
      view.comment_id = 1;
      view.viewed = new Date();

      comment.views = [view];

      expect(comment.viewed).toBeNull();
    });
  });

  describe('Date fields', () => {
    it('should have created date field', () => {
      const date = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.created = date;

      expect(comment.created).toEqual(date);
    });

    it('should have updated date field', () => {
      const date = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.updated = date;

      expect(comment.updated).toEqual(date);
    });

    it('should have screenshot field', () => {
      const comment = new Comment();
      comment.screenshot = 'http://example.com/screenshot.png';

      expect(comment.screenshot).toBe('http://example.com/screenshot.png');
    });

    it('should allow null screenshot', () => {
      const comment = new Comment();
      comment.screenshot = null;

      expect(comment.screenshot).toBeNull();
    });
  });

  describe('Transform decorators', () => {
    it('should transform created date for widget group', () => {
      const date = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.created = date;
      comment.user_id = 1;
      comment.views = [];

      const transformed = plainToInstance(Comment, comment, { groups: ['widget'] });
      expect(transformed.created).toBe('2024-01-01 10:30:45');
    });

    it('should transform updated date for widget group', () => {
      const date = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.updated = date;
      comment.user_id = 1;
      comment.views = [];

      const transformed = plainToInstance(Comment, comment, { groups: ['widget'] });
      expect(transformed.updated).toBe('2024-01-01 10:30:45');
    });

    it('should transform viewed date for widget group when user has viewed', () => {
      const viewedDate = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.user_id = 1;

      const view = new CommentView();
      view.user_id = 1;
      view.comment_id = 1;
      view.viewed = viewedDate;
      comment.views = [view];

      const transformed = plainToInstance(Comment, comment, { groups: ['widget'] });
      expect(transformed.viewed).toBe('2024-01-01 10:30:45');
    });

    it('should not transform dates when not in widget group', () => {
      const date = new Date('2024-01-01T10:30:45.123Z');
      const comment = new Comment();
      comment.created = date;
      comment.updated = date;
      comment.user_id = 1;
      comment.views = [];

      const transformed = plainToInstance(Comment, comment);
      expect(transformed.created).toEqual(date);
      expect(transformed.updated).toEqual(date);
    });
  });

  describe('Exclude decorators', () => {
    it('should exclude site_id from serialization', () => {
      const comment = new Comment();
      comment.site_id = 123;

      const transformed = plainToInstance(Comment, comment, { excludeExtraneousValues: true });
      expect(transformed.site_id).toBeUndefined();
    });
  });
});
