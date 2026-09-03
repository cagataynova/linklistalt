import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListDetail } from '@/components/list-detail';
import { serverApi } from '@/lib/api';
import type { List } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };
async function load(id: string) { try { return await serverApi<List>(`/lists/${encodeURIComponent(id)}`); } catch { notFound(); } }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const list = await load((await params).id); return { title: list.title, description: list.description ?? `${list.title} ürün koleksiyonu.` }; }
export default async function ListPage({ params }: Props) { return <ListDetail list={await load((await params).id)} />; }
