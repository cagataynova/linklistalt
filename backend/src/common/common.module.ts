import { Global, Module } from '@nestjs/common';
import { UrlSafetyService } from './url-safety.service';
import { SystemMetricsService } from './system-metrics.service';

@Global()
@Module({
  providers: [UrlSafetyService, SystemMetricsService],
  exports: [UrlSafetyService, SystemMetricsService],
})
export class CommonModule {}
