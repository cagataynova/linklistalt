'use client';

import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { auth } from '@/lib/firebase';

export function LoginForm() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); try { await signInWithEmailAndPassword(auth, email, password); router.push('/dashboard'); } catch { setMessage('E-posta veya parola doğrulanamadı.'); } finally { setBusy(false); } }
  async function google() { setBusy(true); try { await signInWithPopup(auth, new GoogleAuthProvider()); router.push('/dashboard'); } catch { setMessage('Google ile giriş tamamlanamadı.'); } finally { setBusy(false); } }
  async function reset() { if (!email) return setMessage('Önce e-posta adresini yaz.'); await sendPasswordResetEmail(auth, email); setMessage('Parola yenileme bağlantısı gönderildi.'); }
  return <form className="auth-card" onSubmit={submit}><div className="eyebrow">TEKRAR HOŞ GELDİN</div><h1>Hesabına gir</h1><label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label><label>Parola<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button><button type="button" className="secondary-button" onClick={google} disabled={busy}>Google ile devam et</button><button type="button" className="text-button" onClick={reset}>Parolamı unuttum</button></form>;
}
