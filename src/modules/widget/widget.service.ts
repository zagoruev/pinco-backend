import { Injectable } from '@nestjs/common';
import { USER_COLORS } from '../user/user.entity';
import { RequestUser } from 'src/types/express';
import { AppConfigService } from '../config/config.service';
interface PincoConfig {
  apiRoot: string;
  colors: string[];
  features: string[];
  userId?: number;
}

@Injectable()
export class WidgetService {
  constructor(private readonly configService: AppConfigService) {}

  generateWidgetScript(key: string, user: RequestUser): string {
    const pincoConfig: PincoConfig = {
      apiRoot: this.configService.get('app.url'),
      colors: USER_COLORS,
      features: ['screenshots', 'details'],
    };

    if (user) {
      pincoConfig.userId = Number(user.id);
    }

    return `var Pinco = ${JSON.stringify(pincoConfig, null, 4)};
      (function() {
          var root = document.createElement('div');
          root.id = 'pinco-ui';
          root.dir = 'ltr';
          document.body.appendChild(root);
          var script = document.createElement('script');
          script.src = 'http://localhost:3000/static/js/ui.js';
          script.type = 'text/javascript';
          document.head.appendChild(script);
      })();`;
  }
}
