import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

const blockedTerms = ['dolandırıcılık', 'sahte kimlik', 'nefret söylemi'];
const suspiciousUrl = /(?:bit\.ly|tinyurl\.com|t\.me\/|wa\.me\/)/i;

@Injectable()
export class ContentModerationService {
  evaluate(...values: Array<string | null | undefined>): ContentStatus {
    const text = values.filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
    const repeated =
      /(.)\1{9,}/u.test(text) || /\b(.{3,20})(?:\s+\1){4,}\b/iu.test(text);
    return blockedTerms.some((term) => text.includes(term)) ||
      suspiciousUrl.test(text) ||
      repeated
      ? ContentStatus.PENDING_REVIEW
      : ContentStatus.ACTIVE;
  }
}
