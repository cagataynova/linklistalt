'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { authorizedApi } from '@/lib/api';
import type { AdminInvite, AdminUser, Me, Report } from '@/lib/types';
import { useAuth } from './auth-provider';

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [createdCode, setCreatedCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');

  const refresh = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setMessage('');
    try {
      const identity = await authorizedApi<Me>('/me');
      setMe(identity);
      if (identity.role === 'USER') return;
      const [inviteRows, reportRows, userRows] = await Promise.all([
        authorizedApi<AdminInvite[]>('/admin/invites'),
        authorizedApi<Report[]>('/admin/moderation'),
        authorizedApi<AdminUser[]>('/admin/users'),
      ]);
      setInvites(inviteRows);
      setReports(reportRows);
      setUsers(userRows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Yönetim verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, refresh, user]);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusyId('invite');
    setMessage('');
    try {
      const result = await authorizedApi<{ code: string }>('/admin/invites', {
        method: 'POST',
        body: JSON.stringify({ label: String(data.get('label') || '') || undefined, maxUses: Number(data.get('maxUses')) }),
      });
      setCreatedCode(result.code);
      form.reset();
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Davet oluşturulamadı.');
    } finally {
      setBusyId('');
    }
  }

  async function setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    setBusyId(id);
    setMessage('');
    try {
      await authorizedApi(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.');
    } finally {
      setBusyId('');
    }
  }

  if (authLoading || (user && (loading || (!me && !message)))) return <main className="state-page" aria-busy="true"><div className="spinner" aria-label="Yönetim paneli yükleniyor" /><p>Yönetim verileri hazırlanıyor…</p></main>;
  if (!user) return <main className="state-page"><div className="eyebrow">OTURUM GEREKLİ</div><h1>Yönetim paneli için giriş yap.</h1><Link className="primary-button" href="/login">Giriş yap</Link></main>;
  if (!me && message) return <main className="state-page"><div className="eyebrow">BAĞLANTI HATASI</div><h1>Yönetim ekranı açılamadı.</h1><p>{message}</p><button className="primary-button" onClick={() => void refresh()}>Tekrar dene</button></main>;
  if (me?.role === 'USER') return <main className="state-page"><div className="eyebrow">YETKİ GEREKLİ</div><h1>Bu alan yalnız yönetim ekibine açık.</h1><Link className="secondary-button" href="/dashboard">Listelerime dön</Link></main>;

  return <main className="admin-page">
    <header className="detail-hero"><div className="eyebrow">YÖNETİM</div><h1>Davetli beta kontrol merkezi</h1><p>Davetleri, şikâyetleri ve kullanıcı durumlarını tek yerden yönet.</p></header>
    {message && <div className="admin-alert" role="alert"><span>{message}</span><button className="text-button" onClick={() => void refresh()}>Yenile</button></div>}
    <section className="admin-grid">
      <article className="admin-panel"><h2>Davet kodları</h2>{me?.role === 'ADMIN' && <form className="inline-form" onSubmit={createInvite}><label><span className="sr-only">Etiket</span><input name="label" placeholder="Etiket" maxLength={80} /></label><label><span className="sr-only">Kullanım kotası</span><input name="maxUses" type="number" min="1" max="10000" defaultValue="10" /></label><button className="primary-button" disabled={busyId === 'invite'}>{busyId === 'invite' ? 'Oluşturuluyor…' : 'Oluştur'}</button></form>}{createdCode && <p className="secret-result">Yeni kod: <strong>{createdCode}</strong><br />Bu değer tekrar gösterilmez.</p>}<div className="table-list">{invites.length ? invites.map((invite) => <div key={invite.id}><span>{invite.prefix}… {invite.label}</span><b>{invite.useCount}/{invite.maxUses}</b></div>) : <p>Henüz davet kodu yok.</p>}</div></article>
      <article className="admin-panel"><h2>Açık şikâyetler</h2><div className="table-list">{reports.length ? reports.map((report) => <div key={report.id}><span>{report.targetType}: {report.reason}</span><b>{report.status}</b></div>) : <p>Açık şikâyet yok.</p>}</div></article>
      <article className="admin-panel full-panel"><h2>Kullanıcılar</h2><div className="table-list">{users.length ? users.map((account) => <div key={account.id}><span>{account.profile?.displayName ?? account.email}<small>{account.role} · {account.status}</small></span>{me?.role === 'ADMIN' && account.id !== me.id && <button className="text-button" disabled={busyId === account.id} onClick={() => void setStatus(account.id, account.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}>{busyId === account.id ? 'Güncelleniyor…' : account.status === 'SUSPENDED' ? 'Geri aç' : 'Askıya al'}</button>}</div>) : <p>Kullanıcı bulunamadı.</p>}</div></article>
    </section>
  </main>;
}
