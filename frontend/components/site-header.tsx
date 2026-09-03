'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './auth-provider';

export function SiteHeader() {
  const { user } = useAuth();
  return <header className="topbar"><Link className="wordmark" href="/">linklist<span>.</span></Link><nav className="desktop-nav" aria-label="Ana menü">{user ? <><Link className="nav-item" href="/dashboard">Listelerim</Link><button className="secondary-button" onClick={() => signOut(auth)}>Çıkış</button></> : <><Link className="nav-item" href="/login">Giriş yap</Link><Link className="primary-button" href="/invite">Davet kodum var</Link></>}</nav></header>;
}
