import { Comment } from '../../comment/comment.entity';

export interface ScreenshotStrategy {
  save(file: Express.Multer.File, comment: Comment): Promise<string>;
  getUrl(comment: Comment): string;
  delete(comment: Comment): Promise<void>;
}
