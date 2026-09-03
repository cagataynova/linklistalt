# LinkList davetli beta

LinkList, farklı mağazalardaki ürünleri kişisel listelerde toplamak ve paylaşmak için geliştirilmiş davetli beta uygulamasıdır. Monorepo; Next.js arayüzü, NestJS API, Prisma/PostgreSQL veri modeli ve S3 uyumlu görsel depolamadan oluşur.

## Yerel kurulum

Gereksinimler: Node.js 22+ ve npm. Docker yalnız isteğe bağlı yerel PostgreSQL/MinIO geliştirme ortamı için kullanılır; cloud alpha kurulumu Docker gerektirmez.

```powershell
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
npm run infra:up
npm run prisma:migrate:deploy --workspace=backend
npm run prisma:seed --workspace=backend
```

Firebase Auth Emulator ayrı bir terminalde `npm run dev:auth` ile, API `npm run dev:backend` ile ve arayüz `npm run dev:frontend` ile çalışır.

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- OpenAPI: `http://localhost:3001/api/docs`
- MinIO: `http://localhost:9001`
- Firebase Emulator UI: `http://localhost:4000`

Development seed kullanıcısı `admin@linklist.local`, davet kodu `LINKLIST-BETA` değeridir. Seed production ortamında çalışmayı reddeder. Firebase emulator hesabı arayüzden oluşturulur.

## Kalite kapısı

`npm run verify`; backend ve frontend lint/typecheck, backend unit testleri ve iki production build’i çalıştırır. Aynı zincir, başlangıç migration’ını gerçek PostgreSQL’e uyguladıktan sonra her pull request için GitHub Actions üzerinde zorunludur.

## Dağıtım

- Frontend Netlify üzerinde root `netlify.toml` ile yayınlanır. Netlify site ayarlarında `frontend/.env.example` içindeki değerler tanımlanır; Next.js OpenNext adaptörü otomatik kurulur.
- Backend için `render.yaml` blueprint’i kullanılır. Neon bağlantısı `DATABASE_URL`, Firebase Admin ve R2 değerleri Render secret’ları olarak girilir.
- `FRONTEND_ORIGINS`, production origin ile yalnız projeye ait Netlify deploy-preview kalıbını virgülle ayırır; örnek: `https://linklist.example,https://deploy-preview-*.netlify.app`.
- R2 bucket CORS politikası yalnız Netlify production/preview origin’lerinden `PUT` isteklerine ve gerekli `content-type` başlığına izin vermelidir.

Production hesapları ve secret’ları repoya alınmaz. Neon, R2 ve Render kullanımı sağlayıcı panellerinde haftalık izlenmeli; bütçe uyarıları ücretsiz kotanın %70’ine ayarlanmalıdır.
