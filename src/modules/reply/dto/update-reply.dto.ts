import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateReplyDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsOptional()
  @IsNotEmpty()
  message?: string;
}
