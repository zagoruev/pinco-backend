import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentDetails, CommentReference } from '../comment.entity';

export class UpdateCommentDto {
  @ApiProperty({ example: 1, required: true })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Updated message', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  viewed?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  details?: CommentDetails;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  reference?: CommentReference;

  @ApiProperty({ example: 'https://example.com/page', required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  screenshot?: Express.Multer.File;
}
