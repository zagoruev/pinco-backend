import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsEnum } from 'class-validator';
import { UserSiteRole } from '../user-site.entity';

export class UpdateUserSiteRolesDto {
  @ApiProperty({ description: 'The ID of the user' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: 'The ID of the site' })
  @IsNumber()
  site_id: number;

  @ApiProperty({ description: 'The roles of the user' })
  @IsArray()
  @IsEnum(UserSiteRole, { each: true })
  roles: UserSiteRole[];
}
