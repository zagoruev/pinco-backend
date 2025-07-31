import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({ example: 1, required: true })
  @Type(() => Number)
  @IsNumber()
  comment_id: number;

  @ApiProperty({ example: 'This is a reply', required: true })
  @IsNotEmpty()
  @IsString()
  message: string;
}
