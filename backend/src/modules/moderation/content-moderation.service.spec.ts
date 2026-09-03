import { ContentStatus } from '@prisma/client';
import { ContentModerationService } from './content-moderation.service';

describe('ContentModerationService', () => {
  const service = new ContentModerationService();
  it('normal metni aktif bırakır', () =>
    expect(service.evaluate('Sade çalışma masası', 'Günlük seçimler')).toBe(
      ContentStatus.ACTIVE,
    ));
  it.each([
    'dolandırıcılık bağlantısı',
    'tinyurl.com/şüpheli',
    'aaaaaaaaaaaa',
    'spam spam spam spam spam',
  ])('şüpheli içeriği incelemeye alır: %s', (text) =>
    expect(service.evaluate(text)).toBe(ContentStatus.PENDING_REVIEW),
  );
});
