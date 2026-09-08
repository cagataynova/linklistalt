import { SystemMetricsService } from './system-metrics.service';

describe('SystemMetricsService', () => {
  it('son beş dakikanın trafik, hata ve gecikme yüzdeliklerini hesaplar', () => {
    const now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    const service = new SystemMetricsService();

    service.requestStarted();
    service.requestFinished(100, 200);
    service.requestStarted();
    service.requestFinished(300, 503);

    const snapshot = service.snapshot(now);
    expect(snapshot).toMatchObject({
      activeRequests: 0,
      requestsLast5Minutes: 2,
      requestsPerMinute: 0.4,
      errorRate: 50,
      averageMs: 200,
      p50Ms: 100,
      p95Ms: 300,
    });
    expect(snapshot.trend.at(-1)).toMatchObject({
      requestCount: 2,
      errorCount: 1,
    });
    nowSpy.mockRestore();
  });

  it('aktif istek sayısını hiçbir zaman sıfırın altına indirmez', () => {
    const service = new SystemMetricsService();
    service.requestFinished(10, 200);
    expect(service.snapshot().activeRequests).toBe(0);
  });
});
