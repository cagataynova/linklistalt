import { ConflictException } from '@nestjs/common';
import { SocialService } from './social.service';

describe('SocialService', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    block: { findFirst: jest.fn() },
    follow: { upsert: jest.fn(), deleteMany: jest.fn() },
    list: { findFirst: jest.fn() },
    listLike: { upsert: jest.fn(), deleteMany: jest.fn() },
  };
  const service = new SocialService(prisma as never);
  beforeEach(() => jest.clearAllMocks());
  it('takibi birleşik anahtarla idempotent upsert eder', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'target' });
    prisma.block.findFirst.mockResolvedValue(null);
    await service.follow('me', 'target');
    await service.follow('me', 'target');
    expect(prisma.follow.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.follow.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          followerId_followingId: { followerId: 'me', followingId: 'target' },
        },
      }),
    );
  });
  it('engellenen kullanıcılar arasında etkileşimi reddeder', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'target' });
    prisma.block.findFirst.mockResolvedValue({ blockerId: 'target' });
    await expect(service.follow('me', 'target')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
