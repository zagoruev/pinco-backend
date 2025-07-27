import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CommentDetailsDto {
  @ApiProperty({ example: 768 })
  @IsNumber()
  vh: number;

  @ApiProperty({ example: 1024 })
  @IsNumber()
  vw: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  vx: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  vy: number;

  @ApiProperty({ example: 'production' })
  @IsString()
  env: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'This needs to be fixed' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'https://example.com/page' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CommentDetailsDto)
  details?: CommentDetailsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  screenshot?: Express.Multer.File;
}
