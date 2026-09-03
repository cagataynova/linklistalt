import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, ListVisibility } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CreateReportDto } from './social.dto';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}
  async follow(userId: string, targetId: string) {
    if (userId === targetId)
      throw new BadRequestException('Kendinizi takip edemezsiniz.');
    await this.assertUsersCanInteract(userId, targetId);
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
      update: {},
      create: { followerId: userId, followingId: targetId },
    });
    return { following: true };
  }
  async unfollow(userId: string, targetId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId: userId, followingId: targetId },
    });
    return { following: false };
  }
  async like(userId: string, listId: string) {
    const list = await this.prisma.list.findFirst({
      where: {
        id: listId,
        visibility: ListVisibility.PUBLIC,
        contentStatus: ContentStatus.ACTIVE,
      },
    });
    if (!list) throw new NotFoundException('Liste bulunamadı.');
    await this.assertUsersCanInteract(userId, list.ownerId);
    await this.prisma.listLike.upsert({
      where: { userId_listId: { userId, listId } },
      update: {},
      create: { userId, listId },
    });
    return { liked: true };
  }
  async unlike(userId: string, listId: string) {
    await this.prisma.listLike.deleteMany({ where: { userId, listId } });
    return { liked: false };
  }
  async block(userId: string, targetId: string) {
    if (userId === targetId)
      throw new BadRequestException('Kendinizi engelleyemezsiniz.');
    if (!(await this.prisma.user.findUnique({ where: { id: targetId } })))
      throw new NotFoundException('Kullanıcı bulunamadı.');
    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: targetId },
        },
        update: {},
        create: { blockerId: userId, blockedId: targetId },
      }),
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: targetId },
            { followerId: targetId, followingId: userId },
          ],
        },
      }),
    ]);
    return { blocked: true };
  }
  async unblock(userId: string, targetId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: targetId },
    });
    return { blocked: false };
  }
  async report(reporterId: string, dto: CreateReportDto) {
    if (dto.targetType === 'USER' && dto.targetId === reporterId)
      throw new BadRequestException('Kendinizi şikâyet edemezsiniz.');
    return this.prisma.report.create({ data: { reporterId, ...dto } });
  }
  private async assertUsersCanInteract(a: string, b: string) {
    const [target, block] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: b, status: 'ACTIVE' } }),
      this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: a, blockedId: b },
            { blockerId: b, blockedId: a },
          ],
        },
      }),
    ]);
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (block)
      throw new ConflictException('Engellenmiş kullanıcılar etkileşemez.');
  }
}
