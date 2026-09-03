import { Global, Module } from '@nestjs/common';
import { UrlSafetyService } from './url-safety.service';

@Global()
@Module({ providers: [UrlSafetyService], exports: [UrlSafetyService] })
export class CommonModule {}
