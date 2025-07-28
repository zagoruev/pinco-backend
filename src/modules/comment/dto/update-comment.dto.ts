import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentDetails } from '../comment.entity';
import { Transform, Type } from 'class-transformer';

export class UpdateCommentDto {
  @ApiProperty({ example: 1, required: true })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'Updated message', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  details?: CommentDetails;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string | null;

  @ApiProperty({ example: '/page', required: false })
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: false, require_host: false })
  url?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  resolved?: boolean;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  screenshot?: Express.Multer.File;
}
