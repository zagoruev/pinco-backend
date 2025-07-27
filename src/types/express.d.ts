import { TokenPayload } from '../modules/auth/token.service';
import { Site } from '../modules/site/site.entity';
import { UserSite } from '../modules/user/user-site.entity';

export type RequestUser = TokenPayload & { sites: UserSite[] };

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      site?: Site;
    }
  }
}
