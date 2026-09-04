'use client';

import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { publicApi } from '@/lib/api';
import { auth } from '@/lib/firebase';

type Ticket = { signupTicket: string; expiresInSeconds: number };

export function InviteForm() {
  const router = useRouter(); const [ticket, setTicket] = useState(''); const [code, setCode] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function claim(event: FormEvent) { event.preventDefault(); setBusy(true); try { const result = await publicApi<Ticket>('/invites/ticket', { method: 'POST', body: JSON.stringify({ code }) }); sessionStorage.setItem('linklist-signup-ticket', result.signupTicket); setTicket(result.signupTicket); setMessage('Davet doğrulandı. Şimdi hesabını oluştur.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Davet doğrulanamadı.'); } finally { setBusy(false); } }
  async function emailSignup(event: FormEvent) { event.preventDefault(); setBusy(true); try { const credential = await createUserWithEmailAndPassword(auth, email, password); await sendEmailVerification(credential.user); setMessage('Doğrulama e-postası gönderildi. Bağlantıyı açtıktan sonra devam et.'); router.push('/onboarding'); } catch { setMessage('Hesap oluşturulamadı. Parola en az 6 karakter olmalı.'); } finally { setBusy(false); } }
  async function googleSignup() { setBusy(true); try { await signInWithPopup(auth, new GoogleAuthProvider()); router.push('/onboarding'); } catch { setMessage('Google kaydı tamamlanamadı.'); } finally { setBusy(false); } }
  if (!ticket) return <form className="auth-card" onSubmit={claim}><div className="eyebrow">DAVETLİ BETA</div><h1>Davet kodunu gir</h1><p>Küçük bir grupla başladığımız için yeni hesaplar davet koduyla açılıyor.</p><label>Davet kodu<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoComplete="off" /></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button" disabled={busy}>Kodu doğrula</button></form>;
  return <form className="auth-card" onSubmit={emailSignup}><div className="eyebrow">DAVET DOĞRULANDI</div><h1>Hesabını oluştur</h1><label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Parola<input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button" disabled={busy}>E-posta ile kaydol</button><button type="button" className="secondary-button" disabled={busy} onClick={googleSignup}>Google ile kaydol</button></form>;
}
