import type { Metadata } from 'next'; import { InviteForm } from '@/components/invite-form';
export const metadata: Metadata = { title: 'Davetli betaya katıl' }; export default function InvitePage() { return <main className="auth-page"><InviteForm /></main>; }
