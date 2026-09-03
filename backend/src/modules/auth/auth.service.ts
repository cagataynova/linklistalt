import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FirebaseService } from './firebase.service';
import type { AuthIdentity } from './auth.types';
import type { BootstrapDto, UpdateProfileDto } from './auth.dto';
import { StorageService } from '../storage/storage.service';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly firebase: FirebaseService,
    private readonly storage: StorageService,
  ) {}

  async claimInvite(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const invite = await this.prisma.inviteCode.findUnique({
      where: { codeHash: hash(code) },
    });
    if (
      !invite ||
      !invite.isActive ||
      invite.useCount >= invite.maxUses ||
      (invite.expiresAt && invite.expiresAt <= new Date())
    ) {
      throw new NotFoundException(
        'Davet kodu geçersiz, dolmuş veya süresi geçmiş.',
      );
    }
    const token = randomBytes(32).toString('base64url');
    await this.prisma.signupTicket.create({
      data: {
        tokenHash: hash(
          `${token}:${this.config.getOrThrow('SIGNUP_TICKET_SECRET')}`,
        ),
        inviteCodeId: invite.id,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    return { signupTicket: token, expiresInSeconds: 600 };
  }

  async bootstrap(identity: AuthIdentity, dto: BootstrapDto) {
    if (!identity.emailVerified)
      throw new ForbiddenException('Önce e-posta adresinizi doğrulayın.');
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: identity.uid },
      include: { profile: true },
    });
    if (existing) return existing;
    const tokenHash = hash(
      `${dto.signupTicket}:${this.config.getOrThrow('SIGNUP_TICKET_SECRET')}`,
    );
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const ticket = await tx.signupTicket.findUnique({
            where: { tokenHash },
            include: { inviteCode: true },
          });
          if (!ticket || ticket.consumedAt || ticket.expiresAt <= new Date())
            throw new NotFoundException(
              'Kayıt bileti geçersiz veya süresi dolmuş.',
            );
          const invite = ticket.inviteCode;
          if (
            !invite.isActive ||
            invite.useCount >= invite.maxUses ||
            (invite.expiresAt && invite.expiresAt <= new Date())
          )
            throw new ConflictException('Davet kodu kullanım sınırına ulaştı.');
          const user = await tx.user.create({
            data: {
              firebaseUid: identity.uid,
              email: identity.email,
              emailVerified: true,
              profile: {
                create: {
                  username: dto.username,
                  displayName: dto.displayName,
                },
              },
            },
            include: { profile: true },
          });
          await tx.signupTicket.update({
            where: { id: ticket.id },
            data: { consumedAt: new Date() },
          });
          await tx.inviteCode.update({
            where: { id: invite.id },
            data: { useCount: { increment: 1 } },
          });
          await tx.inviteRedemption.create({
            data: { inviteCodeId: invite.id, userId: user.id },
          });
          return user;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new ConflictException(
        'Kullanıcı adı veya e-posta zaten kullanımda.',
      );
    }
  }

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({ where: { userId }, data: dto });
  }

  async deleteAccount(user: User): Promise<void> {
    const images = await this.prisma.productImage.findMany({
      where: { product: { ownerId: user.id } },
      select: { storageKey: true },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        email: `deleted-${user.id}@invalid.local`,
        firebaseUid: `deleted-${user.id}`,
        profile: {
          update: {
            username: `deleted-${user.id.slice(0, 8)}`,
            displayName: 'Silinmiş kullanıcı',
            bio: null,
            avatarUrl: null,
            contentStatus: 'REMOVED',
          },
        },
        lists: {
          updateMany: {
            where: {},
            data: { visibility: 'PRIVATE', contentStatus: 'REMOVED' },
          },
        },
        products: {
          updateMany: { where: {}, data: { contentStatus: 'REMOVED' } },
        },
      },
    });
    await this.firebase.deleteUser(user.firebaseUid);
    await Promise.allSettled(
      images.map(({ storageKey }) => this.storage.deleteObject(storageKey)),
    );
  }
}
