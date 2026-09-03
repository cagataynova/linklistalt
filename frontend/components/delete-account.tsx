'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authorizedApi } from '@/lib/api';
import { auth } from '@/lib/firebase';

export function DeleteAccount() { const router = useRouter(); const [message, setMessage] = useState(''); async function remove() { if (!window.confirm('Hesabın ve kişisel verilerin kalıcı olarak silinecek. Devam edilsin mi?')) return; try { await authorizedApi('/me', { method: 'DELETE' }); await signOut(auth); router.push('/'); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Hesap silinemedi.'); } } return <div className="danger-zone"><h2>Hesabı sil</h2><p>Profilin anonimleştirilir, içeriklerin kapatılır ve hesabın geri alınamaz.</p><button className="danger-button" onClick={remove}>Hesabımı sil</button>{message && <span role="alert">{message}</span>}</div>; }
