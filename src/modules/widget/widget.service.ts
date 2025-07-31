import { Injectable } from '@nestjs/common';

import { RequestUser } from '../../types/express';
import { AppConfigService } from '../config/config.service';
import { USER_COLORS } from '../user/user.entity';

interface PincoConfig {
  apiRoot: string;
  colors: string[];
  features: string[];
  userId?: number;
}

@Injectable()
export class WidgetService {
  constructor(private readonly configService: AppConfigService) {}

  private createDomElement(tagName: string, attributes: Record<string, string>): string {
    const attributeStrings = Object.entries(attributes)
      .map(([key, value]) => `${key} = '${value}';`)
      .join('\n        ');

    return `var element = document.createElement('${tagName}');${attributeStrings}document.head.appendChild(element);`;
  }

  private generateWidgetScriptElements(isDev: boolean): string {
    const urlConfigKey = isDev ? 'app.widgetDevUrl' : 'app.widgetUrl';
    const url = this.configService.get(urlConfigKey);

    const scriptElement = this.createDomElement('script', {
      'element.src': `${url}/js/ui.js`,
      'element.type': 'text/javascript',
    });

    if (isDev) {
      return scriptElement;
    }

    const styleElement = this.createDomElement('link', {
      'element.href': `${url}/css/ui.css`,
      'element.rel': 'stylesheet',
    });

    return scriptElement + styleElement;
  }

  generateWidgetScript(key: string, user: RequestUser): string {
    const pincoConfig: PincoConfig = {
      apiRoot: `${this.configService.get('app.url')}/`,
      colors: USER_COLORS,
      features: ['screenshots', 'details'],
    };

    const isDev = Boolean(this.configService.get('app.widgetIsDev'));

    if (user) {
      pincoConfig.userId = Number(user.id);
    }

    return `var Pinco = ${JSON.stringify(pincoConfig, null, 4)};
      (function() {
        var root = document.createElement('div');
        root.id = 'pinco-ui';
        root.dir = 'ltr';
        document.body.appendChild(root);
        ${this.generateWidgetScriptElements(isDev)}}
      )();`;
  }
}
