import { Injectable } from '@nestjs/common';
import { SystemMetricsService } from '../../common/system-metrics.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SystemStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: SystemMetricsService,
  ) {}

  async getStatus() {
    const checkedAt = new Date();
    const databaseStartedAt = performance.now();
    let databaseStatus: 'UP' | 'DOWN' = 'UP';
    let databaseError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'DOWN';
      databaseError = 'Veritabanı bağlantısı kurulamadı.';
    }

    const databaseLatencyMs = Math.round(performance.now() - databaseStartedAt);
    const api = this.metrics.snapshot(checkedAt.getTime());

    return {
      status:
        databaseStatus === 'UP' ? ('HEALTHY' as const) : ('DEGRADED' as const),
      checkedAt: checkedAt.toISOString(),
      windowMinutes: 5,
      api: { status: 'UP' as const, ...api },
      database: {
        status: databaseStatus,
        latencyMs: databaseLatencyMs,
        ...(databaseError ? { message: databaseError } : {}),
      },
    };
  }
}
