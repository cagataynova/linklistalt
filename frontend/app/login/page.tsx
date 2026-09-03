import type { Metadata } from 'next'; import { LoginForm } from '@/components/login-form';
export const metadata: Metadata = { title: 'Giriş yap' }; export default function LoginPage() { return <main className="auth-page"><LoginForm /></main>; }
