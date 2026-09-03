import { createHash } from 'crypto';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Production ortamında seed çalıştırılamaz.');
  const admin = await prisma.user.upsert({
    where: { firebaseUid: 'dev-admin' },
    update: { role: UserRole.ADMIN },
    create: { firebaseUid: 'dev-admin', email: 'admin@linklist.local', emailVerified: true, role: UserRole.ADMIN, profile: { create: { username: 'admin', displayName: 'LinkList Admin' } } },
  });
  const code = 'LINKLIST-BETA';
  await prisma.inviteCode.upsert({ where: { codeHash: createHash('sha256').update(code).digest('hex') }, update: {}, create: { codeHash: createHash('sha256').update(code).digest('hex'), codePrefix: 'LINKLIS', label: 'Yerel geliştirme', maxUses: 100, createdById: admin.id } });
  const demo = await prisma.user.upsert({ where: { firebaseUid: 'dev-demo' }, update: {}, create: { firebaseUid: 'dev-demo', email: 'demo@linklist.local', emailVerified: true, profile: { create: { username: 'ahmetsirin', displayName: 'Ahmet Şirin', bio: 'İyi tasarlanmış şeyler, sıcak evler ve uzun süre giyilecek parçalar.' } } } });
  await prisma.list.upsert({ where: { id: '10000000-0000-4000-8000-000000000001' }, update: {}, create: { id: '10000000-0000-4000-8000-000000000001', ownerId: demo.id, title: 'Yeni ev için', description: 'Bir gün aynı evde görmek istediğim sakin, sıcak parçalar.', category: 'Ev', visibility: 'PUBLIC' } });
}

seed().finally(() => prisma.$disconnect());
