import { Injectable } from '@nestjs/common';

type RequestSample = {
  timestamp: number;
  durationMs: number;
  failed: boolean;
};

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SAMPLES = 10_000;

@Injectable()
export class SystemMetricsService {
  private readonly startedAt = Date.now();
  private activeRequests = 0;
  private samples: RequestSample[] = [];

  requestStarted(): void {
    this.activeRequests += 1;
  }

  requestFinished(durationMs: number, statusCode: number): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    const now = Date.now();
    this.samples.push({
      timestamp: now,
      durationMs: Math.max(0, durationMs),
      failed: statusCode >= 500,
    });
    this.prune(now);
  }

  snapshot(now = Date.now()) {
    this.prune(now);
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recent = this.samples.filter(
      (sample) => sample.timestamp >= fiveMinutesAgo,
    );
    const durations = recent
      .map((sample) => sample.durationMs)
      .sort((a, b) => a - b);
    const failures = recent.filter((sample) => sample.failed).length;
    const memory = process.memoryUsage();

    return {
      startedAt: new Date(this.startedAt).toISOString(),
      uptimeSeconds: Math.floor((now - this.startedAt) / 1000),
      activeRequests: this.activeRequests,
      requestsLast5Minutes: recent.length,
      requestsPerMinute: Number((recent.length / 5).toFixed(1)),
      errorRate: recent.length
        ? Number(((failures / recent.length) * 100).toFixed(1))
        : 0,
      averageMs: this.average(durations),
      p50Ms: this.percentile(durations, 0.5),
      p95Ms: this.percentile(durations, 0.95),
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      trend: this.trend(now),
    };
  }

  private trend(now: number) {
    const currentMinute = Math.floor(now / 60_000) * 60_000;
    return Array.from({ length: 15 }, (_, index) => {
      const minute = currentMinute - (14 - index) * 60_000;
      const rows = this.samples.filter(
        (sample) =>
          sample.timestamp >= minute && sample.timestamp < minute + 60_000,
      );
      const durations = rows
        .map((sample) => sample.durationMs)
        .sort((a, b) => a - b);
      return {
        minute: new Date(minute).toISOString(),
        requestCount: rows.length,
        errorCount: rows.filter((sample) => sample.failed).length,
        averageMs: this.average(durations),
        p95Ms: this.percentile(durations, 0.95),
      };
    });
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return Math.round(
      values.reduce((total, value) => total + value, 0) / values.length,
    );
  }

  private percentile(values: number[], ratio: number): number {
    if (!values.length) return 0;
    return Math.round(values[Math.ceil(values.length * ratio) - 1]);
  }

  private prune(now: number): void {
    const cutoff = now - WINDOW_MS;
    const firstCurrent = this.samples.findIndex(
      (sample) => sample.timestamp >= cutoff,
    );
    if (firstCurrent === -1) this.samples = [];
    else if (firstCurrent > 0) this.samples = this.samples.slice(firstCurrent);
    if (this.samples.length > MAX_SAMPLES)
      this.samples = this.samples.slice(-MAX_SAMPLES);
  }
}
