import { SystemMetricsService } from '../../common/system-metrics.service';
import { SystemStatusService } from './system-status.service';

describe('SystemStatusService', () => {
  it('API ve veritabanı sağlıklı olduğunda sistemi healthy döndürür', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new SystemStatusService(
      prisma as never,
      new SystemMetricsService(),
    );
    await expect(service.getStatus()).resolves.toMatchObject({
      status: 'HEALTHY',
      api: { status: 'UP' },
      database: { status: 'UP' },
    });
  });

  it('veritabanı erişilemezse endpointi düşürmeden degraded döndürür', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('offline')),
    };
    const service = new SystemStatusService(
      prisma as never,
      new SystemMetricsService(),
    );
    await expect(service.getStatus()).resolves.toMatchObject({
      status: 'DEGRADED',
      database: { status: 'DOWN' },
    });
  });
});
