import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateReplyDto {
  @IsNumber()
  @IsNotEmpty()
  comment_id: number;

  @IsNotEmpty()
  message: string;
}
