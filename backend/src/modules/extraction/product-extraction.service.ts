import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlSafetyService } from '../../common/url-safety.service';

type RecordValue = Record<string, unknown>;
const allowedHosts = new Set([
  'trendyol.com',
  'www.trendyol.com',
  'hepsiburada.com',
  'www.hepsiburada.com',
  'lcw.com',
  'www.lcw.com',
  'amazon.com.tr',
  'www.amazon.com.tr',
]);

@Injectable()
export class ProductExtractionService {
  private readonly logger = new Logger(ProductExtractionService.name);
  constructor(
    private readonly safety: UrlSafetyService,
    private readonly config: ConfigService,
  ) {}
  async extract(url: string) {
    let response: Awaited<ReturnType<UrlSafetyService['fetchLimited']>>;
    try {
      response = await this.safety.fetchLimited(url, {
        allowedHosts,
        maxBytes: this.config.get<number>('PRODUCT_FETCH_MAX_BYTES', 2_000_000),
        timeoutMs: this.config.get<number>('PRODUCT_FETCH_TIMEOUT_MS', 8000),
        accept: 'text/html,application/xhtml+xml',
      });
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'product.extract.failed',
          store: this.storeFor(url),
          errorType: error instanceof Error ? error.name : 'UnknownError',
        }),
      );
      throw error;
    }
    if (!response.contentType.includes('html'))
      throw new BadRequestException('Bağlantı bir ürün sayfası değil.');
    const html = new TextDecoder().decode(response.body);
    const structured = this.findStructuredProduct(html);
    const offer = Array.isArray(structured?.offers)
      ? this.asRecord(structured.offers[0])
      : this.asRecord(structured?.offers);
    const brandValue = structured?.brand;
    const brand =
      typeof brandValue === 'string'
        ? brandValue
        : this.stringValue(this.asRecord(brandValue)?.name);
    const store = this.storeFor(response.url);
    const name =
      this.stringValue(structured?.name) ??
      this.textById(html, 'productTitle') ??
      this.storeSpecificName(html, store) ??
      this.meta(html, 'og:title');
    const price =
      this.priceValue(offer?.price ?? structured?.price) ??
      this.amazonPrice(html);
    const images = this.unique([
      ...this.toStrings(structured?.image),
      this.meta(html, 'og:image') ?? '',
      ...this.amazonImages(html),
    ]).slice(0, 10);
    const result = {
      name,
      brand,
      price,
      currency: this.stringValue(offer?.priceCurrency) ?? 'TRY',
      sourceUrl: response.url,
      images,
    };
    if (!name) {
      this.logger.warn(
        JSON.stringify({
          event: 'product.extract.partial',
          store,
          fields: Object.entries(result)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key),
        }),
      );
      throw new UnprocessableEntityException({
        code: 'PRODUCT_EXTRACTION_FAILED',
        message: 'Bağlantıdan ürün bilgisi alınamadı.',
        manualEntryAllowed: true,
        partialData: result,
      });
    }
    this.logger.log(
      JSON.stringify({
        event: 'product.extract.succeeded',
        store,
        hasPrice: Boolean(price),
        imageCount: images.length,
      }),
    );
    return result;
  }
  private storeFor(url: string) {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.endsWith('trendyol.com')) return 'trendyol';
    if (host.endsWith('hepsiburada.com')) return 'hepsiburada';
    if (host.endsWith('lcw.com')) return 'lcwaikiki';
    if (host.endsWith('amazon.com.tr')) return 'amazon-tr';
    return 'unknown';
  }
  private storeSpecificName(html: string, store: string) {
    const patterns: Record<string, RegExp> = {
      trendyol:
        /<h1[^>]+class=["'][^"']*pr-new-br[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
      hepsiburada:
        /<h1[^>]+data-test-id=["']product-name["'][^>]*>([\s\S]*?)<\/h1>/i,
      lcwaikiki:
        /<h1[^>]+class=["'][^"']*product-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
      'amazon-tr': /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
    };
    const value = patterns[store]?.exec(html)?.[1];
    return value
      ? this.decode(
          value
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
      : undefined;
  }
  private findStructuredProduct(html: string) {
    for (const match of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        const found = this.findProduct(JSON.parse(this.decode(match[1])));
        if (found) return found;
      } catch {
        /* malformed merchant JSON-LD */
      }
    }
    return undefined;
  }
  private findProduct(value: unknown): RecordValue | undefined {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findProduct(item);
        if (found) return found;
      }
      return;
    }
    const record = this.asRecord(value);
    if (!record) return;
    const type = record['@type'];
    if (type === 'Product' || (Array.isArray(type) && type.includes('Product')))
      return record;
    return this.findProduct(record['@graph']);
  }
  private asRecord(value: unknown) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as RecordValue)
      : undefined;
  }
  private stringValue(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? this.decode(value.trim())
      : undefined;
  }
  private priceValue(value: unknown) {
    if (typeof value === 'string') {
      const normalized = value.replace(/[^\d.,]/g, '');
      const comma = normalized.lastIndexOf(',') > normalized.lastIndexOf('.');
      const parsed = Number(
        comma
          ? normalized.replaceAll('.', '').replace(',', '.')
          : normalized.replaceAll(',', ''),
      );
      return Number.isFinite(parsed) ? parsed.toFixed(2) : undefined;
    }
    return typeof value === 'number' && Number.isFinite(value)
      ? value.toFixed(2)
      : undefined;
  }
  private meta(html: string, key: string) {
    return html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        'i',
      ),
    )?.[1];
  }
  private textById(html: string, id: string) {
    const value = html.match(
      new RegExp(`<[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'),
    )?.[1];
    return value
      ? this.decode(
          value
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
      : undefined;
  }
  private amazonPrice(html: string) {
    const value = html.match(
      /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    )?.[1];
    return value ? this.priceValue(value) : undefined;
  }
  private amazonImages(html: string) {
    const value = html.match(/data-a-dynamic-image=(["'])([\s\S]*?)\1/i)?.[2];
    if (!value) return [];
    try {
      return Object.keys(JSON.parse(this.decode(value)) as RecordValue);
    } catch {
      return [];
    }
  }
  private toStrings(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : typeof value === 'string'
        ? [value]
        : [];
  }
  private unique(values: string[]) {
    return [
      ...new Set(
        values
          .map((value) => this.decode(value))
          .filter((value) => value.startsWith('https://')),
      ),
    ];
  }
  private decode(value: string) {
    return value
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&')
      .replaceAll('&#39;', "'")
      .replaceAll('&nbsp;', ' ');
  }
}
