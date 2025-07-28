export interface ReplyResponse {
  id: number;
  comment_id: number;
  message: string;
  created: Date;
  updated: Date;
  user_id: number;
  formatted_message?: string;
}
