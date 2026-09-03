import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppUserGuard } from './app-user.guard';
import { FirebaseService } from './firebase.service';
import { IdentityGuard } from './identity.guard';
import { RolesGuard } from './roles';
import { StorageModule } from '../storage/storage.module';

@Global()
@Module({
  imports: [StorageModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseService,
    IdentityGuard,
    AppUserGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    FirebaseService,
    IdentityGuard,
    AppUserGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
