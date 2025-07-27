import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  Length,
  IsHexColor,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: '#FF0000' })
  @IsHexColor()
  color: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @Length(1, 255)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @Length(6, 255)
  password: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: [UserRole.ADMIN], enum: UserRole, isArray: true })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];

  @ApiProperty({ example: [1], isArray: true, required: false })
  @IsArray()
  @IsOptional()
  siteIds?: number[];

  @ApiProperty({
    example: true,
    required: false,
    description: 'Send invite email with secret link',
  })
  @IsBoolean()
  @IsOptional()
  invite?: boolean;
}
