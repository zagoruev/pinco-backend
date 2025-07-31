import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { Site } from '../site/site.entity';
import { SiteModule } from '../site/site.module';
import { UserSite } from '../user/user-site.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSite, Site]),
    SiteModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.get('app.authSecret'),
        signOptions: {
          expiresIn: configService.get('app.authTokenExpiresIn'),
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, CookieAuthGuard, RolesGuard, OriginGuard],
  exports: [TokenService, CookieAuthGuard, RolesGuard, OriginGuard],
})
export class AuthModule {}
