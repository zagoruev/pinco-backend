import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { User } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';
import { Site } from '../site/site.entity';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OriginGuard } from '../../common/guards/origin.guard';
import { SiteModule } from '../site/site.module';
import { UserModule } from '../user/user.module';
import { AppConfigService } from '../config/config.service';
import { AppConfigModule } from '../config/config.module';

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
  providers: [
    AuthService,
    TokenService,
    CookieAuthGuard,
    RolesGuard,
    OriginGuard,
  ],
  exports: [TokenService, CookieAuthGuard, RolesGuard, OriginGuard],
})
export class AuthModule {}
