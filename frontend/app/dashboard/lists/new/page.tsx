import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth-gate';
import { CreateListForm } from '@/components/create-list-form';

export const metadata: Metadata = { title: 'Liste oluştur' };
export default function NewListPage() { return <AuthGate><main className="auth-page"><CreateListForm /></main></AuthGate>; }
