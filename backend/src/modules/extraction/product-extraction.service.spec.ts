import { ConfigService } from '@nestjs/config';
import { ProductExtractionService } from './product-extraction.service';

const hosts = [
  'www.trendyol.com',
  'www.hepsiburada.com',
  'www.lcw.com',
  'www.amazon.com.tr',
];
const html = `<html><head><script type="application/ld+json">{"@type":"Product","name":"Keten Gömlek","brand":{"name":"Link Marka"},"image":["https://cdn.example/image.jpg"],"offers":{"price":"1299,90","priceCurrency":"TRY"}}</script></head></html>`;

describe('ProductExtractionService', () => {
  it.each(hosts)(
    '%s ürün JSON-LD verisini ortak adaptör sırasıyla okur',
    async (host) => {
      const safety = {
        fetchLimited: jest.fn().mockResolvedValue({
          url: `https://${host}/urun`,
          contentType: 'text/html',
          body: new TextEncoder().encode(html),
        }),
      };
      const config = {
        get: jest.fn((_key: string, fallback: number) => fallback),
      } as unknown as ConfigService;
      const result = await new ProductExtractionService(
        safety as never,
        config,
      ).extract(`https://${host}/urun`);
      expect(result).toMatchObject({
        name: 'Keten Gömlek',
        brand: 'Link Marka',
        price: '1299.90',
        currency: 'TRY',
      });
    },
  );
});
