import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '../user/user.entity';
import { Comment } from './comment.entity';

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
