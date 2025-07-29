import { IsNumber } from 'class-validator';

export class ResendInviteDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  site_id: number;
}
