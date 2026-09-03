import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedRequest } from './auth.types';
import { FirebaseService } from './firebase.service';

@Injectable()
export class OptionalUserGuard implements CanActivate {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) return true;
    try {
      request.identity = await this.firebase.verifyToken(
        authorization.slice(7),
      );
      request.appUser =
        (await this.prisma.user.findUnique({
          where: { firebaseUid: request.identity.uid },
        })) ?? undefined;
    } catch {
      /* Public reads stay anonymous when an optional token is stale. */
    }
    return true;
  }
}
