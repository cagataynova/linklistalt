import type { ApiEnvelope, ApiError } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export async function serverApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return ((await response.json()) as ApiEnvelope<T>).data;
}
export async function publicApi<T>(path: string, init?: RequestInit): Promise<T> {
  return parse<T>(await fetch(`${API_BASE}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } }));
}

export async function authorizedApi<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Oturum gerekli.');
  const send = async (forceRefresh: boolean) => fetch(`${API_BASE}${path}`, { ...init, headers: { 'content-type': 'application/json', authorization: `Bearer ${await user.getIdToken(forceRefresh)}`, ...init?.headers } });
  let response = await send(false);
  if (response.status === 401) response = await send(true);
  return parse<T>(response);
}

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json() as ApiEnvelope<T> | ApiError;
  if (!response.ok) throw new Error('message' in payload ? payload.message : 'İstek tamamlanamadı.');
  return (payload as ApiEnvelope<T>).data;
}
