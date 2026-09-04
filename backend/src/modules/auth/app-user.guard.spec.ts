import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AppUserGuard } from './app-user.guard';

jest.mock('./identity.guard', () => ({
  IdentityGuard: class IdentityGuard {},
}));

describe('AppUserGuard', () => {
  const activeAdmin = {
    id: 'admin-id',
    firebaseUid: 'firebase-uid',
    email: 'ca.demircioglu@gmail.com',
    emailVerified: true,
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  function setup(
    identity = {
      uid: 'firebase-uid',
      email: 'ca.demircioglu@gmail.com',
      emailVerified: true,
    },
  ) {
    const request: {
      identity?: typeof identity;
      appUser?: typeof activeAdmin;
    } = {};
    const identityGuard = {
      canActivate: jest.fn().mockImplementation(() => {
        request.identity = identity;
        return true;
      }),
    };
    const prisma = {
      user: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    const guard = new AppUserGuard(identityGuard as never, prisma as never);
    return { guard, context, prisma, request };
  }

  it('binds a verified Firebase identity to a pre-provisioned user once', async () => {
    const { guard, context, prisma, request } = setup();
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeAdmin);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        email: 'ca.demircioglu@gmail.com',
        firebaseUid: { startsWith: 'pending:' },
        status: 'ACTIVE',
      },
      data: { firebaseUid: 'firebase-uid', emailVerified: true },
    });
    expect(request.appUser).toEqual(activeAdmin);
  });

  it('does not bind an unverified identity', async () => {
    const { guard, context, prisma } = setup({
      uid: 'firebase-uid',
      email: 'ca.demircioglu@gmail.com',
      emailVerified: false,
    });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an inactive user', async () => {
    const { guard, context, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue({
      ...activeAdmin,
      status: 'SUSPENDED',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
