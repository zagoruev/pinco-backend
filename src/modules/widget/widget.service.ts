import { Injectable } from '@nestjs/common';
import { USER_COLORS } from '../user/user.entity';

@Injectable()
export class WidgetService {
  constructor() {}

  generateWidgetScript(key: string): string {
    const pincoConfig = {
      apiRoot: 'http://localhost:3001/',
      userId: '1',
      key,
      colors: USER_COLORS,
      features: ['screenshots', 'details'],
    };

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
