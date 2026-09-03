'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { authorizedApi } from '@/lib/api';

export function OnboardingForm() {
  const router = useRouter(); const [username, setUsername] = useState(''); const [displayName, setDisplayName] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); const signupTicket = sessionStorage.getItem('linklist-signup-ticket'); if (!signupTicket) return setMessage('Kayıt bileti bulunamadı; davet kodunu yeniden doğrula.'); setBusy(true); try { await authorizedApi('/auth/bootstrap', { method: 'POST', body: JSON.stringify({ signupTicket, username, displayName }) }); sessionStorage.removeItem('linklist-signup-ticket'); router.push('/dashboard'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Profil oluşturulamadı. E-postanı doğruladığından emin ol.'); } finally { setBusy(false); } }
  return <form className="auth-card" onSubmit={submit}><div className="eyebrow">SON BİR ADIM</div><h1>Profilini tamamla</h1><label>Görünen ad<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} required /></label><label>Kullanıcı adı<div className="input-prefix"><span>@</span><input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} minLength={3} required /></div></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Profil oluşturuluyor…' : 'LinkList’e başla'}</button></form>;
}
