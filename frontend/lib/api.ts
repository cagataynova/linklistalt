import type { ApiEnvelope, ApiError } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code = 'REQUEST_FAILED',
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function serverApi<T>(path: string): Promise<T> {
  return request<T>(path, { next: { revalidate: 60 } });
}

export async function publicApi<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init);
}

export async function authorizedApi<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = await import('./firebase');
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new ApiRequestError('Bu işlem için giriş yapmalısın.', 401, 'AUTH_REQUIRED');
  const send = async (forceRefresh: boolean) => {
    const headers = jsonHeaders(init);
    headers.set('authorization', `Bearer ${await user.getIdToken(forceRefresh)}`);
    return requestResponse(path, { ...init, headers });
  };
  let response = await send(false);
  if (response.status === 401) response = await send(true);
  return parse<T>(response);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return parse<T>(await requestResponse(path, { ...init, headers: jsonHeaders(init) }));
}

async function requestResponse(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiRequestError('Sunucuya ulaşılamadı. Lütfen bağlantını kontrol edip tekrar dene.', 0, 'NETWORK_ERROR');
  }
}

function jsonHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return headers;
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: ApiEnvelope<T> | ApiError | null = null;
  try { payload = text ? JSON.parse(text) as ApiEnvelope<T> | ApiError : null; } catch { /* Upstream may return an HTML error page. */ }
  if (!response.ok) {
    const apiError = payload && 'message' in payload ? payload : null;
    throw new ApiRequestError(
      apiError?.message ?? (response.status >= 500 ? 'Sunucu geçici olarak yanıt veremiyor. Lütfen tekrar dene.' : 'İstek tamamlanamadı.'),
      response.status,
      apiError?.code,
      apiError?.requestId,
    );
  }
  if (!payload || !('data' in payload)) throw new ApiRequestError('Sunucudan geçersiz bir yanıt alındı.', response.status, 'INVALID_RESPONSE');
  return (payload as ApiEnvelope<T>).data;
}
