import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Config } from '../../config';
import { LeafTypes, Leaves } from './config.types';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get<T extends Leaves<Config>>(propertyPath: T): LeafTypes<Config, T> {
    return this.configService.get(propertyPath) as LeafTypes<Config, T>;
  }
}
