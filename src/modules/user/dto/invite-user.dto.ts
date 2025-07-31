import { IsArray, IsBoolean, IsEnum, IsNumber } from 'class-validator';

import { UserSiteRole } from '../user-site.entity';

export class InviteUserDto {
  @IsNumber()
  user_id: number;

  @IsNumber()
  site_id: number;

  @IsArray()
  @IsEnum(UserSiteRole, { each: true })
  roles: UserSiteRole[];

  @IsBoolean()
  invite: boolean;
}
