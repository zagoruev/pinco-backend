import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteLoginDto {
  @ApiProperty({ example: 'invite-token-here' })
  @IsString()
  invite: string;
}
