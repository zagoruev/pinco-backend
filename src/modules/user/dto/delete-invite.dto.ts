import { IsNumber } from 'class-validator';

export class DeleteInviteDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  site_id: number;
}
