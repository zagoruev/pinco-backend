import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';

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
}
