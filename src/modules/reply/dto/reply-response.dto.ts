export interface ReplyResponse {
  id: number;
  comment_id: number;
  message: string;
  created: string;
  updated: string;
  user_id: number;
  formatted_message?: string;
}
