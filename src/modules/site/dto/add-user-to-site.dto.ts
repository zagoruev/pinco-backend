import { IsInt, IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserSiteRole } from '../../user/user-site.entity';

export class AddUserToSiteDto {
  @ApiProperty({ description: 'User ID to add to the site' })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Roles to assign to the user for this site',
    enum: UserSiteRole,
    isArray: true,
    example: [UserSiteRole.COLLABORATOR],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserSiteRole, { each: true })
  roles: UserSiteRole[];
}
