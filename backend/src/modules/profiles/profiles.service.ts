import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, ListVisibility } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  async findPublic(username: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        username,
        contentStatus: ContentStatus.ACTIVE,
        user: { status: 'ACTIVE' },
      },
      include: {
        user: {
          select: {
            id: true,
            createdAt: true,
            _count: { select: { followers: true, following: true } },
            lists: {
              where: {
                visibility: ListVisibility.PUBLIC,
                contentStatus: ContentStatus.ACTIVE,
              },
              orderBy: { updatedAt: 'desc' },
              include: {
                _count: { select: { listProducts: true, likes: true } },
                listProducts: {
                  take: 4,
                  orderBy: { position: 'asc' },
                  include: {
                    product: {
                      include: {
                        images: { take: 1, orderBy: { position: 'asc' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Profil bulunamadı.');
    return profile;
  }
}
