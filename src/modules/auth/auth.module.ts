import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SecretService } from './secret.service';
import { User } from '../user/user.entity';
import { UserSite } from '../user/user-site.entity';
import { Site } from '../site/site.entity';
import { CookieAuthGuard } from '../../common/guards/cookie-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OriginGuard } from '../../common/guards/origin.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSite, Site]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('app.jwtSecret'),
        signOptions: {
          expiresIn: configService.get('app.jwtExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SecretService,
    CookieAuthGuard,
    RolesGuard,
    OriginGuard,
  ],
  exports: [
    TokenService,
    SecretService,
    CookieAuthGuard,
    RolesGuard,
    OriginGuard,
  ],
})
export class AuthModule {}