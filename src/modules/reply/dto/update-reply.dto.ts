import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateReplyDto {
  @ApiProperty({ example: 1, required: true })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'This is a reply', required: true })
  @IsString()
  @IsNotEmpty()
  message: string;
}
