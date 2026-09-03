import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { AuthIdentity } from './auth.types';

@Injectable()
export class FirebaseService {
  constructor(private readonly config: ConfigService) {
    const mode = this.config.get<string>('AUTH_MODE');
    if (mode === 'emulator')
      process.env.FIREBASE_AUTH_EMULATOR_HOST =
        this.config.get<string>('FIREBASE_AUTH_EMULATOR_HOST') ??
        '127.0.0.1:9099';
    if (!getApps().length && mode !== 'test') {
      const projectId = this.config.get<string>(
        'FIREBASE_PROJECT_ID',
        'linklist-local',
      );
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.config
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replaceAll('\\n', '\n');
      initializeApp(
        clientEmail && privateKey
          ? {
              credential: cert({ projectId, clientEmail, privateKey }),
              projectId,
            }
          : { projectId },
      );
    }
  }

  async verifyToken(token: string): Promise<AuthIdentity> {
    if (this.config.get<string>('AUTH_MODE') === 'test')
      return this.verifyTestToken(token);
    try {
      const decoded = await getAuth().verifyIdToken(token, true);
      if (!decoded.email) throw new Error('missing-email');
      return {
        uid: decoded.uid,
        email: decoded.email.toLowerCase(),
        emailVerified: decoded.email_verified === true,
      };
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum.');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    if (this.config.get<string>('AUTH_MODE') !== 'test')
      await getAuth().deleteUser(uid);
  }

  private verifyTestToken(token: string): AuthIdentity {
    const [prefix, uid, email, verified] = token.split(':');
    if (prefix !== 'test' || !uid || !email)
      throw new UnauthorizedException('Geçersiz test oturumu.');
    return {
      uid,
      email: email.toLowerCase(),
      emailVerified: verified === 'verified',
    };
  }
}
