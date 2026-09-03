import type { Metadata } from 'next'; import { CreateListForm } from '@/components/create-list-form';
export const metadata: Metadata = { title: 'Liste oluştur' }; export default function NewListPage() { return <main className="auth-page"><CreateListForm /></main>; }
