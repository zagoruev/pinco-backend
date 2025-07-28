import { Injectable } from '@nestjs/common';

@Injectable()
export class WidgetService {
  constructor() {}

  generateWidgetScript(key: string): string {
    const pincoConfig = {
      apiRoot: 'http://localhost:3001/',
      // userId: '1',
      key,
      colors: [
        '#4C53F1',
        '#119AFA',
        '#EDAB00',
        '#D64D4D',
        '#48B836',
        '#B865DF',
        '#ED741C',
        '#00A0D2',
        '#E04DAE',
        '#148F63',
      ],
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
