import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, ListVisibility, type User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { ContentModerationService } from '../moderation/content-moderation.service';
import type { CreateListDto, UpdateListDto } from './lists.dto';

const detailInclude = {
  owner: { include: { profile: true } },
  listProducts: {
    orderBy: { position: 'asc' as const },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' as const } } },
      },
    },
  },
  _count: { select: { likes: true, listProducts: true } },
};

const summaryInclude = {
  listProducts: {
    take: 4,
    orderBy: { position: 'asc' as const },
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { position: 'asc' as const } },
        },
      },
    },
  },
  _count: { select: { likes: true, listProducts: true } },
};

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ContentModerationService,
  ) {}
  listMine(ownerId: string, cursor?: string) {
    return this.prisma.list.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: summaryInclude,
    });
  }
  async dashboard(ownerId: string, cursor?: string) {
    const [me, lists] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: ownerId },
        include: { profile: true },
      }),
      this.listMine(ownerId, cursor),
    ]);
    return { me, lists };
  }
  create(ownerId: string, dto: CreateListDto) {
    return this.prisma.list.create({
      data: {
        ...dto,
        ownerId,
        contentStatus: this.moderation.evaluate(dto.title, dto.description),
        shareToken:
          dto.visibility === ListVisibility.UNLISTED
            ? randomBytes(24).toString('base64url')
            : null,
      },
      include: detailInclude,
    });
  }
  async find(id: string, viewer?: User) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!list || list.contentStatus !== ContentStatus.ACTIVE)
      throw new NotFoundException('Liste bulunamadı.');
    const privileged =
      viewer && (viewer.id === list.ownerId || viewer.role !== 'USER');
    if (list.visibility !== ListVisibility.PUBLIC && !privileged)
      throw new NotFoundException('Liste bulunamadı.');
    if (viewer && (await this.isBlocked(viewer.id, list.ownerId)))
      throw new NotFoundException('Liste bulunamadı.');
    return list;
  }
  async findShared(token: string) {
    const list = await this.prisma.list.findFirst({
      where: {
        shareToken: token,
        visibility: ListVisibility.UNLISTED,
        contentStatus: ContentStatus.ACTIVE,
      },
      include: detailInclude,
    });
    if (!list) throw new NotFoundException('Paylaşım bağlantısı geçersiz.');
    return list;
  }
  async update(ownerId: string, id: string, dto: UpdateListDto) {
    await this.assertOwner(ownerId, id);
    const visibility = dto.visibility;
    return this.prisma.list.update({
      where: { id },
      data: {
        ...dto,
        contentStatus: this.moderation.evaluate(dto.title, dto.description),
        ...(visibility
          ? {
              shareToken:
                visibility === ListVisibility.UNLISTED
                  ? randomBytes(24).toString('base64url')
                  : null,
            }
          : {}),
      },
      include: detailInclude,
    });
  }
  async remove(ownerId: string, id: string) {
    await this.assertOwner(ownerId, id);
    await this.prisma.list.delete({ where: { id } });
  }
  private async assertOwner(ownerId: string, id: string) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!list) throw new NotFoundException('Liste bulunamadı.');
    if (list.ownerId !== ownerId)
      throw new ForbiddenException('Bu listeyi değiştiremezsiniz.');
  }
  private async isBlocked(a: string, b: string) {
    return Boolean(
      await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: a, blockedId: b },
            { blockerId: b, blockedId: a },
          ],
        },
      }),
    );
  }
}
