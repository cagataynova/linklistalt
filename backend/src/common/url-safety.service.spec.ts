import { BadRequestException } from '@nestjs/common';
import { UrlSafetyService } from './url-safety.service';

describe('UrlSafetyService', () => {
  const service = new UrlSafetyService();
  it.each([
    'http://www.trendyol.com/x',
    'https://127.0.0.1/x',
    'https://10.0.0.1/x',
    'https://user:pass@www.trendyol.com/x',
  ])('güvensiz hedefi reddeder: %s', async (url) => {
    await expect(service.assertPublicHttps(url)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('izin listesi dışındaki mağazayı reddeder', async () => {
    await expect(
      service.assertPublicHttps(
        'https://example.com/x',
        new Set(['www.trendyol.com']),
      ),
    ).rejects.toThrow('henüz desteklenmiyor');
  });
});
