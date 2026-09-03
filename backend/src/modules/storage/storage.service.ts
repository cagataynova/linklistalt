import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import sharp, { type Metadata } from 'sharp';
import { PrismaService } from '../../database/prisma.service';
import { UrlSafetyService } from '../../common/url-safety.service';
import type { CreateUploadDto } from './storage.dto';

@Injectable()
export class StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly safety: UrlSafetyService,
  ) {
    this.bucket = this.config.get<string>('R2_BUCKET', 'linklist');
    this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL') ?? '').replace(
      /\/$/,
      '',
    );
    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.client =
      endpoint && accessKeyId && secretAccessKey
        ? new S3Client({
            endpoint,
            region: this.config.get<string>('R2_REGION', 'auto'),
            forcePathStyle:
              endpoint.includes('localhost') || endpoint.includes('127.0.0.1'),
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }
  async createIntent(ownerId: string, dto: CreateUploadDto) {
    const client = this.requireClient();
    const id = randomUUID();
    const storageKey = `pending/${ownerId}/${id}`;
    const intent = await this.prisma.uploadIntent.create({
      data: {
        id,
        ownerId,
        storageKey,
        mimeType: dto.mimeType,
        byteSize: dto.byteSize,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: dto.mimeType,
        ContentLength: dto.byteSize,
      }),
      { expiresIn: 900 },
    );
    return {
      id: intent.id,
      uploadUrl,
      headers: { 'content-type': dto.mimeType },
      expiresAt: intent.expiresAt,
    };
  }
  async finalize(ownerId: string, id: string) {
    const client = this.requireClient();
    const intent = await this.prisma.uploadIntent.findFirst({
      where: { id, ownerId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });
    if (!intent)
      throw new NotFoundException(
        'Upload isteği bulunamadı veya süresi doldu.',
      );
    const head = await client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: intent.storageKey }),
    );
    if (
      !head.ContentLength ||
      head.ContentLength > 8_000_000 ||
      head.ContentType !== intent.mimeType
    )
      throw new BadRequestException(
        'Yüklenen dosyanın türü veya boyutu geçersiz.',
      );
    const object = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: intent.storageKey }),
    );
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) throw new BadRequestException('Yüklenen dosya okunamadı.');
    const input = sharp(bytes, { failOn: 'error' });
    const inputMetadata = await input.metadata();
    this.assertImageMetadata(inputMetadata, intent.mimeType);
    const pipeline = input
      .rotate()
      .resize({
        width: 1600,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84 });
    const webp = await pipeline.toBuffer();
    const metadata = await sharp(webp).metadata();
    const finalKey = `users/${ownerId}/images/${randomUUID()}.webp`;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: finalKey,
        Body: webp,
        ContentType: 'image/webp',
        CacheControl: 'public,max-age=31536000,immutable',
      }),
    );
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: intent.storageKey }),
    );
    await this.prisma.uploadIntent.update({
      where: { id },
      data: {
        storageKey: finalKey,
        status: 'READY',
        mimeType: 'image/webp',
        byteSize: webp.length,
      },
    });
    return {
      uploadId: id,
      storageKey: finalKey,
      publicUrl: `${this.publicUrl}/${finalKey}`,
      width: metadata.width,
      height: metadata.height,
      mimeType: 'image/webp',
    };
  }
  async importRemote(ownerId: string, sourceUrl: string) {
    const client = this.requireClient();
    const response = await this.safety.fetchLimited(sourceUrl, {
      maxBytes: 8_000_000,
      timeoutMs: 8000,
      accept: 'image/avif,image/webp,image/png,image/jpeg',
    });
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
        response.contentType,
      )
    )
      throw new BadRequestException('Uzak görsel türü desteklenmiyor.');
    const input = sharp(response.body, { failOn: 'error' });
    const inputMetadata = await input.metadata();
    this.assertImageMetadata(inputMetadata, response.contentType);
    const pipeline = input
      .rotate()
      .resize({
        width: 1600,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84 });
    const body = await pipeline.toBuffer();
    const metadata = await sharp(body).metadata();
    const storageKey = `users/${ownerId}/images/${randomUUID()}.webp`;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: body,
        ContentType: 'image/webp',
        CacheControl: 'public,max-age=31536000,immutable',
      }),
    );
    return {
      storageKey,
      publicUrl: `${this.publicUrl}/${storageKey}`,
      sourceUrl,
      width: metadata.width,
      height: metadata.height,
      mimeType: 'image/webp',
    };
  }
  async copyForOwner(ownerId: string, storageKey: string) {
    const client = this.requireClient();
    const newKey = `users/${ownerId}/images/${randomUUID()}.webp`;
    await client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${storageKey}`,
        Key: newKey,
        ContentType: 'image/webp',
        MetadataDirective: 'REPLACE',
      }),
    );
    return { storageKey: newKey, publicUrl: `${this.publicUrl}/${newKey}` };
  }
  async consumeUpload(ownerId: string, id: string) {
    const intent = await this.prisma.uploadIntent.findFirst({
      where: { id, ownerId, status: 'READY' },
    });
    if (!intent)
      throw new NotFoundException('Hazır görsel yüklemesi bulunamadı.');
    await this.prisma.uploadIntent.update({
      where: { id },
      data: { status: 'ATTACHED' },
    });
    return {
      storageKey: intent.storageKey,
      publicUrl: `${this.publicUrl}/${intent.storageKey}`,
      mimeType: intent.mimeType,
    };
  }
  async deleteObject(storageKey: string) {
    if (this.client)
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
  }
  private assertImageMetadata(metadata: Metadata, declaredMimeType: string) {
    const formatToMime: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (!metadata.format || formatToMime[metadata.format] !== declaredMimeType)
      throw new BadRequestException(
        'Görsel imzası beyan edilen MIME türüyle eşleşmiyor.',
      );
    if (
      width < 32 ||
      height < 32 ||
      width > 12_000 ||
      height > 12_000 ||
      width * height > 40_000_000
    )
      throw new BadRequestException(
        'Görsel ölçüleri izin verilen sınırların dışında.',
      );
  }
  private requireClient() {
    if (!this.client || !this.publicUrl)
      throw new ServiceUnavailableException('Obje depolama yapılandırılmamış.');
    return this.client;
  }
}
