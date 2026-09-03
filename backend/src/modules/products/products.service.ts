import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  ListVisibility,
  Prisma,
  type User,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ContentModerationService } from '../moderation/content-moderation.service';
import { StorageService } from '../storage/storage.service';
import type { CreateProductDto, UpdateProductDto } from './products.dto';

const include = {
  images: { orderBy: { position: 'asc' as const } },
  listProducts: { include: { list: true } },
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly moderation: ContentModerationService,
  ) {}
  async create(ownerId: string, dto: CreateProductDto) {
    const list = await this.prisma.list.findFirst({
      where: { id: dto.listId, ownerId },
    });
    if (!list) throw new NotFoundException('Hedef liste bulunamadı.');
    const images = await Promise.all(
      dto.images.slice(0, 10).map(async (image, position) => {
        const stored = image.uploadId
          ? await this.storage.consumeUpload(ownerId, image.uploadId)
          : image.sourceUrl
            ? await this.storage.importRemote(ownerId, image.sourceUrl)
            : null;
        if (!stored) throw new NotFoundException('Görsel kaynağı bulunamadı.');
        return {
          ...stored,
          sourceUrl: image.sourceUrl,
          altText: image.altText,
          position,
        };
      }),
    );
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ownerId,
          name: dto.name,
          brand: dto.brand,
          price: dto.price ? new Prisma.Decimal(dto.price) : null,
          currency: dto.currency.toUpperCase(),
          sourceUrl: dto.sourceUrl,
          note: dto.note,
          savedPriceAt: dto.price ? new Date() : null,
          contentStatus: this.moderation.evaluate(
            dto.name,
            dto.brand,
            dto.note,
            dto.sourceUrl,
          ),
          images: { create: images },
        },
        include,
      });
      const last = await tx.listProduct.aggregate({
        where: { listId: dto.listId },
        _max: { position: true },
      });
      await tx.listProduct.create({
        data: {
          listId: dto.listId,
          productId: product.id,
          position: (last._max.position ?? -1) + 1,
        },
      });
      return product;
    });
  }
  async find(id: string, viewer?: User) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include,
    });
    if (!product || product.contentStatus !== ContentStatus.ACTIVE)
      throw new NotFoundException('Ürün bulunamadı.');
    const privileged =
      viewer && (viewer.id === product.ownerId || viewer.role !== 'USER');
    const publicList = product.listProducts.some(
      ({ list }) =>
        list.visibility === ListVisibility.PUBLIC &&
        list.contentStatus === ContentStatus.ACTIVE,
    );
    if (!privileged && !publicList)
      throw new NotFoundException('Ürün bulunamadı.');
    if (viewer && (await this.isBlocked(viewer.id, product.ownerId)))
      throw new NotFoundException('Ürün bulunamadı.');
    return product;
  }
  async update(ownerId: string, id: string, dto: UpdateProductDto) {
    await this.assertOwner(ownerId, id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        price:
          dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
        currency: dto.currency?.toUpperCase(),
        contentStatus: this.moderation.evaluate(
          dto.name,
          dto.brand,
          dto.note,
          dto.sourceUrl,
        ),
        ...(dto.price !== undefined ? { savedPriceAt: new Date() } : {}),
      },
      include,
    });
  }
  async remove(ownerId: string, id: string) {
    await this.assertOwner(ownerId, id);
    const images = await this.prisma.productImage.findMany({
      where: { productId: id },
      select: { storageKey: true },
    });
    await this.prisma.product.delete({ where: { id } });
    await Promise.allSettled(
      images.map(({ storageKey }) => this.storage.deleteObject(storageKey)),
    );
  }
  async clone(ownerId: string, sourceId: string, targetListId: string) {
    const source = await this.prisma.product.findUnique({
      where: { id: sourceId },
      include: { images: true },
    });
    if (!source || source.contentStatus !== ContentStatus.ACTIVE)
      throw new NotFoundException('Kaynak ürün bulunamadı.');
    const [target, blocked] = await Promise.all([
      this.prisma.list.findFirst({ where: { id: targetListId, ownerId } }),
      this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: ownerId, blockedId: source.ownerId },
            { blockerId: source.ownerId, blockedId: ownerId },
          ],
        },
      }),
    ]);
    if (!target) throw new NotFoundException('Hedef liste bulunamadı.');
    if (blocked)
      throw new ForbiddenException(
        'Engellenen kullanıcıdan ürün kaydedilemez.',
      );
    const copied = await Promise.all(
      source.images.map(async (image) => ({
        ...(await this.storage.copyForOwner(ownerId, image.storageKey)),
        sourceUrl: image.sourceUrl,
        position: image.position,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        altText: image.altText,
      })),
    );
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ownerId,
          clonedFromProductId: source.id,
          name: source.name,
          brand: source.brand,
          price: source.price,
          currency: source.currency,
          sourceUrl: source.sourceUrl,
          note: source.note,
          savedPriceAt: source.savedPriceAt,
          contentStatus: source.contentStatus,
          images: { create: copied },
        },
        include,
      });
      const last = await tx.listProduct.aggregate({
        where: { listId: targetListId },
        _max: { position: true },
      });
      await tx.listProduct.create({
        data: {
          listId: targetListId,
          productId: product.id,
          position: (last._max.position ?? -1) + 1,
        },
      });
      return product;
    });
  }
  private async assertOwner(ownerId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');
    if (product.ownerId !== ownerId)
      throw new ForbiddenException('Bu ürünü değiştiremezsiniz.');
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
