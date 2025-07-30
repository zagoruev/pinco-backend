import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../user/user.entity';

@Entity('comment_views')
export class CommentView {
  @PrimaryColumn({ type: 'int' })
  comment_id: number;

  @PrimaryColumn({ type: 'int' })
  user_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  viewed: Date;

  @ManyToOne(() => Comment, (comment) => comment.views)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne(() => User, (user) => user.commentViews)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
