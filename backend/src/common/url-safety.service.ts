import { BadRequestException, Injectable } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

const privateV4 =
  /^(?:10\.|127\.|169\.254\.|192\.168\.|0\.|224\.|255\.|172\.(?:1[6-9]|2\d|3[01])\.)/;
const privateV6 = /^(?:::1|::$|f[cd][0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i;

@Injectable()
export class UrlSafetyService {
  async assertPublicHttps(
    rawUrl: string,
    allowedHosts?: Set<string>,
  ): Promise<URL> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Geçerli bir HTTPS bağlantısı girin.');
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443')
    )
      throw new BadRequestException(
        'Yalnız güvenli HTTPS bağlantıları kabul edilir.',
      );
    const hostname = url.hostname.toLowerCase();
    if (allowedHosts && !allowedHosts.has(hostname))
      throw new BadRequestException('Bu mağaza henüz desteklenmiyor.');
    const addresses = isIP(hostname)
      ? [{ address: hostname }]
      : await lookup(hostname, { all: true, verbatim: true });
    if (
      !addresses.length ||
      addresses.some(({ address }) => this.isPrivate(address))
    )
      throw new BadRequestException(
        'Yerel veya özel ağ adreslerine erişilemez.',
      );
    return url;
  }

  async fetchLimited(
    rawUrl: string,
    options: {
      allowedHosts?: Set<string>;
      maxBytes: number;
      timeoutMs: number;
      accept: string;
      maxRedirects?: number;
    },
  ): Promise<{ url: string; contentType: string; body: Uint8Array }> {
    let current = rawUrl;
    for (
      let redirect = 0;
      redirect <= (options.maxRedirects ?? 3);
      redirect += 1
    ) {
      const url = await this.assertPublicHttps(current, options.allowedHosts);
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(options.timeoutMs),
        headers: {
          accept: options.accept,
          'accept-language': 'tr-TR,tr;q=0.9,en;q=0.6',
          'user-agent': 'LinkListBot/1.0 (+https://linklist.app)',
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location)
          throw new BadRequestException('Yönlendirme hedefi bulunamadı.');
        current = new URL(location, url).toString();
        continue;
      }
      if (!response.ok)
        throw new BadRequestException(
          `Kaynak sayfaya ulaşılamadı (${response.status}).`,
        );
      const declaredLength = Number(
        response.headers.get('content-length') ?? 0,
      );
      if (declaredLength > options.maxBytes)
        throw new BadRequestException('Kaynak izin verilen boyutu aşıyor.');
      const reader = response.body?.getReader();
      if (!reader) throw new BadRequestException('Kaynak yanıtı okunamadı.');
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > options.maxBytes) {
          await reader.cancel();
          throw new BadRequestException('Kaynak izin verilen boyutu aşıyor.');
        }
        chunks.push(value);
      }
      const body = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.length;
      }
      return {
        url: url.toString(),
        contentType: response.headers.get('content-type')?.split(';')[0] ?? '',
        body,
      };
    }
    throw new BadRequestException('Çok fazla yönlendirme yapıldı.');
  }

  private isPrivate(address: string): boolean {
    return isIP(address) === 4
      ? privateV4.test(address)
      : privateV6.test(address);
  }
}
