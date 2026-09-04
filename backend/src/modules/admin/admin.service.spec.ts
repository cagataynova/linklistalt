import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus, type User } from '@prisma/client';
import { AdminService } from './admin.service';

jest.mock('../auth/auth.service', () => ({
  AuthService: class AuthService {},
}));

describe('AdminService user management', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    moderationAction: { create: jest.fn() },
  };
  const auth = { deleteAccount: jest.fn() };
  const service = new AdminService(prisma as never, auth as never);
  const actor = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  } as User;
  const target = {
    id: 'user-1',
    email: 'user@example.com',
    firebaseUid: 'firebase-user-1',
    emailVerified: true,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(target);
    prisma.user.count.mockResolvedValue(2);
    prisma.user.update.mockResolvedValue({ ...target, role: UserRole.ADMIN });
    prisma.auditLog.create.mockResolvedValue({});
    auth.deleteAccount.mockResolvedValue(undefined);
  });

  it('mevcut kullanıcıyı admin yapar ve audit kaydı oluşturur', async () => {
    await service.updateUserRole(actor, target.id, { role: UserRole.ADMIN });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: UserRole.ADMIN } }),
    );
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).toContain(
      'USER_ROLE_UPDATED',
    );
  });

  it('adminin kendi yetkisini kaldırmasını reddeder', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...target,
      id: actor.id,
      role: UserRole.ADMIN,
    });
    await expect(
      service.updateUserRole(actor, actor.id, { role: UserRole.USER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('son aktif adminin kaldırılmasını reddeder', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...target,
      role: UserRole.ADMIN,
    });
    prisma.user.count.mockResolvedValue(1);
    await expect(
      service.updateUserRole(actor, target.id, { role: UserRole.USER }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('kullanıcıyı mevcut hesap temizleme akışıyla siler', async () => {
    await expect(service.deleteUser(actor, target.id)).resolves.toEqual({
      deleted: true,
    });
    expect(auth.deleteAccount).toHaveBeenCalledWith(target);
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).toContain(
      'USER_DELETED',
    );
  });

  it('kendi hesabını silmeyi ve silinmiş hesabı yönetmeyi reddeder', async () => {
    await expect(service.deleteUser(actor, actor.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    prisma.user.findUnique.mockResolvedValue({
      ...target,
      status: UserStatus.DELETED,
    });
    await expect(
      service.authorizePasswordReset(actor, target.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('parola sıfırlama isteğini hedef e-postayla audit eder', async () => {
    await expect(
      service.authorizePasswordReset(actor, target.id),
    ).resolves.toEqual({ email: target.email });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).toContain(
      'PASSWORD_RESET_REQUESTED',
    );
  });
});
