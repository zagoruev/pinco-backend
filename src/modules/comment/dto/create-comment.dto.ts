import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

class CommentDetailsDto {
  @ApiProperty({ example: 768 })
  @Type(() => Number)
  @IsNumber()
  vh: number;

  @ApiProperty({ example: 1024 })
  @Type(() => Number)
  @IsNumber()
  vw: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  vx: number;

  @ApiProperty({ example: 200 })
  @Type(() => Number)
  @IsNumber()
  vy: number;

  @ApiProperty({ example: 'production' })
  @IsString()
  env: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'This needs to be fixed', required: true })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: '/page', required: true })
  @IsUrl({ require_tld: false, require_protocol: false, require_host: false })
  @IsNotEmpty()
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
