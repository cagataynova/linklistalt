import { FirebaseService } from './firebase.service';

const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('FirebaseService', () => {
  beforeEach(() => mockVerifyIdToken.mockReset());

  it('verifies normal requests without a per-request revocation lookup', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'firebase-uid',
      email: 'user@example.com',
      email_verified: true,
    });
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'AUTH_MODE' ? 'firebase' : fallback,
      ),
    };
    const service = new FirebaseService(config as never);

    await expect(service.verifyToken('id-token')).resolves.toEqual({
      uid: 'firebase-uid',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith('id-token');
  });
});
