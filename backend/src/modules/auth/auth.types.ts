import type { User } from '@prisma/client';
import type { Request } from 'express';

export type AuthIdentity = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

export type AuthenticatedRequest = Request & {
  identity: AuthIdentity;
  appUser?: User;
};
