import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';
import { FirebaseService } from './firebase.service';

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('Oturum gerekli.');
    request.identity = await this.firebase.verifyToken(authorization.slice(7));
    return true;
  }
}
