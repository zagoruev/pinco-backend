import { CommentDetails } from '../comment.entity';
import { User } from '../../user/user.entity';

export interface CommentResponse {
  id: number;
  message: string;
  created: Date;
  updated: Date;
  user_id: number;
  viewed: Date | null;
  details: CommentDetails | null;
  reference: string | null;
  url: string;
  uniqid: string;
  resolved: boolean;
  screenshot?: string;
  replies: ReplyResponse[];
  user?: User;
}

export interface ReplyResponse {
  id: number;
  comment_id: number;
  message: string;
  created: Date;
  updated: Date;
  user_id: number;
  user?: User;
  formatted_message?: string;
}
