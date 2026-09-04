'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';

export function AuthGate({
  children,
  title = 'Devam etmek için giriş yap.',
  description,
  href = '/login',
  action = 'Giriş yap',
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) return <main className="state-page" aria-busy="true"><div className="spinner" aria-label="Oturum yükleniyor" /></main>;
  if (!user) return <main className="state-page"><div className="eyebrow">OTURUM GEREKLİ</div><h1>{title}</h1>{description && <p>{description}</p>}<Link className="primary-button" href={href}>{action}</Link></main>;
  return children;
}
