import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().appUser;
    if (!user) throw new Error('CurrentUser requires AppUserGuard');
    return user;
  },
);
