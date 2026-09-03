# LinkList API sözleşmesi

API `/api/v1` altında çalışır ve canlı OpenAPI belgesi `/api/docs` ile `/api/docs-json` adreslerinden sunulur. Yetkili istekler Firebase ID token’ını `Authorization: Bearer <token>` başlığıyla gönderir.

Başarı yanıtı `{ "data": ..., "meta": { "nextCursor": "..." } }`, hata yanıtı `{ "code": "...", "message": "...", "details": ..., "requestId": "..." }` biçimindedir. Kimlikler UUID, tarihler ISO 8601, para birimi ISO 4217 ve fiyatlar JSON içinde ondalık string’dir.

## Kaynaklar

- Auth: `POST /invites/ticket`, `POST /auth/bootstrap`, `GET /me`, `PATCH /me/profile`, `DELETE /me`
- Profiller: `GET /profiles/:username`
- Listeler: `GET|POST /lists`, `GET|PATCH|DELETE /lists/:id`, `GET /shared/lists/:token`
- Ürünler: `POST /products/extract`, `POST /products`, `GET|PATCH|DELETE /products/:id`, `POST /products/:id/clone`
- Upload: `POST /uploads`, `POST /uploads/:id/finalize`
- Sosyal: `POST|DELETE /social/follows/:userId`, `POST|DELETE /social/list-likes/:listId`
- Güvenlik: `POST|DELETE /blocks/:userId`, `POST /reports`
- Yönetim: `/admin/invites`, `/admin/moderation`, `/admin/users`
- Sağlık: `GET /health/live`, `GET /health/ready`

Liste görünürlükleri `PUBLIC`, `UNLISTED`, `PRIVATE`; içerik durumları `ACTIVE`, `PENDING_REVIEW`, `HIDDEN`, `REMOVED` değerlerini kullanır. Unlisted liste yalnız tahmin edilemeyen `/shared/:token` bağlantısıyla açılır; private kaynaklarda sahiplik API tarafından doğrulanır.

Frontend istemci tiplerinin sözleşme kaynağı Swagger dokümanıdır. API değişikliğinde `/api/docs-json` çıktısı esas alınarak `frontend/lib/types.ts` güncellenir ve `npm run typecheck` zorunlu kalite kapısıdır.
