import { IsNumber } from 'class-validator';

export class RevokeInviteDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  site_id: number;
}
