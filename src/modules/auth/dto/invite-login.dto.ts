import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class InviteLoginDto {
  @ApiProperty({ example: 'invite-token-here', required: true })
  @IsString()
  invite: string;
}
