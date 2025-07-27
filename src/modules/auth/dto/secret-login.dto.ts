import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SecretLoginDto {
  @ApiProperty({ example: 'secret-token-here' })
  @IsString()
  secret: string;
}
