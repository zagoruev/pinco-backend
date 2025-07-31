import { SetMetadata } from '@nestjs/common';

import { OPTIONAL_AUTH_KEY } from '../guards/cookie-auth.guard';

export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
