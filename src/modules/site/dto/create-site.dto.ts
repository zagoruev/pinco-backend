import {
  IsString,
  IsBoolean,
  IsOptional,
  Length,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSiteDto {
  @ApiProperty({ example: 'My Website' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: 'LICENSE-123' })
  @IsString()
  @Length(1, 255)
  license: string;

  @ApiProperty({ example: 'example.com' })
  @IsString()
  @Length(1, 255)
  domain: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
