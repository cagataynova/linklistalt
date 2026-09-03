import { notFound } from 'next/navigation';
import { ListDetail } from '@/components/list-detail';
import { serverApi } from '@/lib/api';
import type { List } from '@/lib/types';

export const metadata = { title: 'Paylaşılan liste', robots: { index: false, follow: false } };
async function load(token: string) { try { return await serverApi<List>(`/shared/lists/${encodeURIComponent(token)}`); } catch { notFound(); } }
export default async function SharedListPage({ params }: { params: Promise<{ token: string }> }) { const list = await load((await params).token); return <ListDetail list={list} />; }
