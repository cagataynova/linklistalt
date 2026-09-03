import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileView } from '@/components/profile-view';
import { serverApi } from '@/lib/api';
import type { Profile } from '@/lib/types';

type Props = { params: Promise<{ username: string }> };
async function load(username: string) { try { return await serverApi<Profile>(`/profiles/${encodeURIComponent(username)}`); } catch { notFound(); } }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const profile = await load((await params).username); return { title: `${profile.displayName} (@${profile.username})`, description: profile.bio ?? `${profile.displayName} tarafından hazırlanan LinkList koleksiyonları.`, openGraph: { images: profile.avatarUrl ? [profile.avatarUrl] : undefined } }; }
export default async function ProfilePage({ params }: Props) { return <ProfileView profile={await load((await params).username)} />; }
