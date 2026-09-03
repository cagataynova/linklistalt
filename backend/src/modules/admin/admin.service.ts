import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  ModerationActionType,
  Prisma,
  ReportTargetType,
  UserStatus,
  type User,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import type {
  AdminCreateInviteDto,
  ModerateDto,
  UpdateUserStatusDto,
} from './admin.dto';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async createInvite(actor: User, dto: AdminCreateInviteDto) {
    const code = `LL-${randomBytes(6).toString('hex').toUpperCase()}`;
    const invite = await this.prisma.inviteCode.create({
      data: {
        codeHash: hash(code),
        codePrefix: code.slice(0, 7),
        label: dto.label,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: actor.id,
      },
    });
    await this.audit(actor.id, 'INVITE_CREATED', 'INVITE', invite.id, {
      maxUses: dto.maxUses,
    });
    return {
      id: invite.id,
      prefix: invite.codePrefix,
      label: invite.label,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
      active: invite.isActive,
      expiresAt: invite.expiresAt,
      code,
    };
  }
  async listInvites() {
    const rows = await this.prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        codePrefix: true,
        label: true,
        maxUses: true,
        useCount: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return rows.map(({ codePrefix, isActive, ...invite }) => ({
      ...invite,
      prefix: codePrefix,
      active: isActive,
    }));
  }
  listReports(status?: string) {
    return this.prisma.report.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'asc' },
      include: { reporter: { include: { profile: true } } },
    });
  }
  listUsers(cursor?: string) {
    return this.prisma.user.findMany({
      take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
    });
  }
  async moderate(actor: User, dto: ModerateDto) {
    const contentStatus = this.statusForAction(dto.action);
    await this.applyContentStatus(dto.targetType, dto.targetId, contentStatus);
    const action = await this.prisma.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        action: dto.action,
        note: dto.note,
      },
    });
    if (dto.reportId)
      await this.prisma.report.update({
        where: { id: dto.reportId },
        data: { status: dto.reportStatus ?? 'RESOLVED' },
      });
    await this.audit(
      actor.id,
      `MODERATION_${dto.action}`,
      dto.targetType,
      dto.targetId,
      { note: dto.note },
    );
    return action;
  }
  async updateUser(actor: User, userId: string, dto: UpdateUserStatusDto) {
    if (actor.id === userId && dto.status !== UserStatus.ACTIVE)
      throw new BadRequestException('Kendi hesabınızı askıya alamazsınız.');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
    });
    await this.prisma.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: 'USER',
        targetId: userId,
        action: dto.status === 'ACTIVE' ? 'RESTORE_USER' : 'SUSPEND_USER',
        note: dto.note,
      },
    });
    await this.audit(actor.id, `USER_${dto.status}`, 'USER', userId, {
      note: dto.note,
    });
    return user;
  }
  private statusForAction(action: ModerationActionType) {
    if (action === 'HIDE') return ContentStatus.HIDDEN;
    if (action === 'REMOVE') return ContentStatus.REMOVED;
    if (action === 'RESTORE') return ContentStatus.ACTIVE;
    return undefined;
  }
  private async applyContentStatus(
    type: ReportTargetType,
    id: string,
    status?: ContentStatus,
  ) {
    if (!status || type === 'USER') return;
    const model =
      type === 'PROFILE'
        ? this.prisma.profile
        : type === 'LIST'
          ? this.prisma.list
          : this.prisma.product;
    try {
      await (model as typeof this.prisma.profile).update({
        where: { id },
        data: { contentStatus: status },
      });
    } catch {
      throw new NotFoundException('Moderasyon hedefi bulunamadı.');
    }
  }
  private audit(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
