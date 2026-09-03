import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedRequest } from './auth.types';
import { IdentityGuard } from './identity.guard';

@Injectable()
export class AppUserGuard implements CanActivate {
  constructor(
    private readonly identityGuard: IdentityGuard,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.identityGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: request.identity.uid },
    });
    if (!user)
      throw new UnauthorizedException('LinkList hesabı henüz oluşturulmamış.');
    if (user.status !== UserStatus.ACTIVE)
      throw new ForbiddenException('Hesap aktif değil.');
    if (!request.identity.emailVerified)
      throw new ForbiddenException('E-posta doğrulaması gerekli.');
    request.appUser = user;
    return true;
  }
}
