import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('./firebase.service', () => ({
  FirebaseService: class FirebaseService {},
}));

describe('AuthService invite quota', () => {
  const signupTicketCreate = jest.fn(
    (input: {
      data: { tokenHash: string; inviteCodeId: string; expiresAt: Date };
    }) => {
      void input;
      return Promise.resolve({});
    },
  );
  const prisma = {
    inviteCode: { findUnique: jest.fn() },
    signupTicket: { create: signupTicketCreate },
  };
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const service = new AuthService(
    prisma as never,
    config,
    {} as never,
    {} as never,
  );
  beforeEach(() => jest.clearAllMocks());
  it.each([
    { isActive: false, useCount: 0, maxUses: 1, expiresAt: null },
    { isActive: true, useCount: 1, maxUses: 1, expiresAt: null },
    { isActive: true, useCount: 0, maxUses: 1, expiresAt: new Date(0) },
  ])('geçersiz veya dolu koddan ticket üretmez', async (invite) => {
    prisma.inviteCode.findUnique.mockResolvedValue({ id: 'invite', ...invite });
    await expect(service.claimInvite('BETA')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.signupTicket.create).not.toHaveBeenCalled();
  });
  it('geçerli kodu açık halde saklamadan yedi günlük ticket üretir', async () => {
    const before = Date.now();
    prisma.inviteCode.findUnique.mockResolvedValue({
      id: 'invite',
      isActive: true,
      useCount: 0,
      maxUses: 2,
      expiresAt: null,
    });
    const result = await service.claimInvite('beta');
    expect(result.expiresInSeconds).toBe(7 * 24 * 60 * 60);
    const createdTicket = signupTicketCreate.mock.calls[0][0];
    expect(createdTicket.data.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 7 * 24 * 60 * 60 * 1_000,
    );
    expect(createdTicket.data.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 7 * 24 * 60 * 60 * 1_000,
    );
    const serializedCall = JSON.stringify(
      prisma.signupTicket.create.mock.calls,
    );
    expect(serializedCall).toContain('"inviteCodeId":"invite"');
    expect(serializedCall).toMatch(/"tokenHash":"[a-f0-9]{64}"/);
  });
});
