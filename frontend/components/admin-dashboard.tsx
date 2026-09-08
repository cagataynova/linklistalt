'use client';

import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { authorizedApi } from '@/lib/api';
import { auth } from '@/lib/firebase';
import type { AdminInvite, AdminUser, Me, Report, SystemStatus } from '@/lib/types';
import { useAuth } from './auth-provider';

const roleLabels: Record<AdminUser['role'], string> = { USER: 'Kullanıcı', MODERATOR: 'Moderatör', ADMIN: 'Admin' };
const statusLabels: Record<AdminUser['status'], string> = { ACTIVE: 'Aktif', SUSPENDED: 'Askıda', DELETED: 'Silinmiş' };

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days) return `${days}g ${hours}sa`;
  if (hours) return `${hours}sa ${minutes}dk`;
  return `${minutes}dk`;
}

function responseTone(milliseconds: number) {
  if (milliseconds <= 400) return 'good';
  if (milliseconds <= 1_000) return 'warning';
  return 'critical';
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [systemMessage, setSystemMessage] = useState('');
  const [systemLoading, setSystemLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return users;
    return users.filter((account) => [account.email, account.profile?.displayName, account.profile?.username, roleLabels[account.role], statusLabels[account.status]].some((value) => value?.toLocaleLowerCase('tr-TR').includes(normalized)));
  }, [query, users]);

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

  const refreshSystem = useCallback(async () => {
    setSystemLoading(true);
    setSystemMessage('');
    try {
      setSystem(await authorizedApi<SystemStatus>('/admin/system'));
    } catch (error) {
      setSystemMessage(error instanceof Error ? error.message : 'Sistem durumu alınamadı.');
    } finally {
      setSystemLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, refresh, user]);

  useEffect(() => {
    if (me?.role !== 'ADMIN') return;
    const firstRefresh = window.setTimeout(() => void refreshSystem(), 0);
    const interval = window.setInterval(() => void refreshSystem(), 30_000);
    return () => {
      window.clearTimeout(firstRefresh);
      window.clearInterval(interval);
    };
  }, [me?.role, refreshSystem]);

  async function runAction(key: string, action: () => Promise<void>) {
    setBusyAction(key);
    setMessage('');
    setNotice('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'İşlem tamamlanamadı.'); } finally { setBusyAction(''); }
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await runAction('invite', async () => {
      const result = await authorizedApi<{ code: string }>('/admin/invites', { method: 'POST', body: JSON.stringify({ label: String(data.get('label') || '') || undefined, maxUses: Number(data.get('maxUses')) }) });
      setCreatedCode(result.code);
      form.reset();
      await refresh();
    });
  }

  async function setStatus(account: AdminUser) {
    const next = account.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const actionLabel = next === 'SUSPENDED' ? 'askıya almak' : 'yeniden açmak';
    if (!window.confirm(`${account.profile?.displayName ?? account.email} adlı kullanıcıyı ${actionLabel} istediğine emin misin?`)) return;
    await runAction(`status:${account.id}`, async () => {
      await authorizedApi(`/admin/users/${account.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await refresh();
      setNotice(next === 'ACTIVE' ? 'Kullanıcı yeniden açıldı.' : 'Kullanıcı askıya alındı.');
    });
  }

  async function setRole(account: AdminUser, role: AdminUser['role']) {
    if (role === account.role) return;
    if (!window.confirm(`${account.profile?.displayName ?? account.email} için rol ${roleLabels[role]} olarak değiştirilsin mi?`)) return;
    await runAction(`role:${account.id}`, async () => {
      await authorizedApi(`/admin/users/${account.id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      await refresh();
      setNotice('Kullanıcı rolü güncellendi.');
    });
  }

  async function resetPassword(account: AdminUser) {
    if (!window.confirm(`${account.email} adresine parola sıfırlama e-postası gönderilsin mi?`)) return;
    await runAction(`reset:${account.id}`, async () => {
      const target = await authorizedApi<{ email: string }>(`/admin/users/${account.id}/password-reset`, { method: 'POST' });
      await sendPasswordResetEmail(auth, target.email);
      setNotice(`Parola sıfırlama e-postası ${target.email} adresine gönderildi.`);
    });
  }

  async function deleteUser(account: AdminUser) {
    const label = account.profile?.displayName ?? account.email;
    if (!window.confirm(`${label} kalıcı olarak silinecek. Profil ve içerikler kapatılacak, kişisel veriler anonimleştirilecek. Bu işlem geri alınamaz. Devam edilsin mi?`)) return;
    await runAction(`delete:${account.id}`, async () => {
      await authorizedApi(`/admin/users/${account.id}`, { method: 'DELETE' });
      await refresh();
      setNotice('Kullanıcı hesabı silindi ve anonimleştirildi.');
    });
  }

  if (authLoading || (user && (loading || (!me && !message)))) return <main className="state-page" aria-busy="true"><div className="spinner" aria-label="Yönetim paneli yükleniyor" /><p>Yönetim verileri hazırlanıyor…</p></main>;
  if (!user) return <main className="state-page"><div className="eyebrow">OTURUM GEREKLİ</div><h1>Yönetim paneli için giriş yap.</h1><Link className="primary-button" href="/login">Giriş yap</Link></main>;
  if (!me && message) return <main className="state-page"><div className="eyebrow">BAĞLANTI HATASI</div><h1>Yönetim ekranı açılamadı.</h1><p>{message}</p><button className="primary-button" onClick={() => void refresh()}>Tekrar dene</button></main>;
  if (me?.role === 'USER') return <main className="state-page"><div className="eyebrow">YETKİ GEREKLİ</div><h1>Bu alan yalnız yönetim ekibine açık.</h1><Link className="secondary-button" href="/dashboard">Listelerime dön</Link></main>;

  return <main className="admin-page">
    <header className="detail-hero"><div className="eyebrow">YÖNETİM</div><h1>Davetli beta kontrol merkezi</h1><p>Davetleri, şikâyetleri, kullanıcı rollerini ve hesap durumlarını tek yerden yönet.</p></header>
    {message && <div className="admin-alert" role="alert"><span>{message}</span><button className="text-button" onClick={() => void refresh()}>Yenile</button></div>}
    {notice && <div className="admin-notice" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Kapat</button></div>}
    <section className="admin-summary" aria-label="Yönetim özeti"><div><strong>{users.filter((account) => account.status === 'ACTIVE').length}</strong><span>aktif kullanıcı</span></div><div><strong>{users.filter((account) => account.role === 'ADMIN' && account.status === 'ACTIVE').length}</strong><span>aktif admin</span></div><div><strong>{reports.length}</strong><span>açık şikâyet</span></div><div><strong>{invites.filter((invite) => invite.active).length}</strong><span>aktif davet</span></div></section>
    {me?.role === 'ADMIN' && <section className="system-panel" aria-labelledby="system-status-title" aria-busy={systemLoading}>
      <div className="system-heading"><div><div className="eyebrow">CANLI GÖZLEM</div><h2 id="system-status-title">Servis durumu</h2><p>API süreci ve Neon bağlantısı 30 saniyede bir kontrol edilir. Trafik ölçümleri son 5 dakikayı gösterir.</p></div><div className="system-heading-actions">{system && <span className={`service-state ${system.status === 'HEALTHY' ? 'state-up' : 'state-down'}`}><i />{system.status === 'HEALTHY' ? 'Tüm sistemler çalışıyor' : 'Kontrol gerekli'}</span>}<button className="secondary-button" disabled={systemLoading} onClick={() => void refreshSystem()}>{systemLoading ? 'Kontrol ediliyor…' : 'Şimdi yenile'}</button></div></div>
      {systemMessage && !system && <div className="system-unavailable" role="alert"><span>{systemMessage}</span><button className="text-button" onClick={() => void refreshSystem()}>Tekrar dene</button></div>}
      {system ? <>
        <div className="service-row"><div><span className={`service-dot ${system.api.status === 'UP' ? 'dot-up' : 'dot-down'}`} /><span><strong>LinkList API</strong><small>Render · çalışma süresi {formatUptime(system.api.uptimeSeconds)}</small></span></div><b>{system.api.status === 'UP' ? 'Çalışıyor' : 'Kesinti'}</b></div>
        <div className="service-row"><div><span className={`service-dot ${system.database.status === 'UP' ? 'dot-up' : 'dot-down'}`} /><span><strong>PostgreSQL</strong><small>Neon · canlı bağlantı kontrolü</small></span></div><b>{system.database.status === 'UP' ? `${system.database.latencyMs} ms` : 'Erişilemiyor'}</b></div>
        <div className="metric-grid" aria-label="Son 5 dakika performans ölçümleri"><div><span>P95 yanıt</span><strong className={`metric-${responseTone(system.api.p95Ms)}`}>{system.api.p95Ms} ms</strong><small>İsteklerin %95&apos;i</small></div><div><span>Ortalama yanıt</span><strong className={`metric-${responseTone(system.api.averageMs)}`}>{system.api.averageMs} ms</strong><small>P50: {system.api.p50Ms} ms</small></div><div><span>İstek yoğunluğu</span><strong>{system.api.requestsPerMinute}/dk</strong><small>{system.api.requestsLast5Minutes} toplam istek</small></div><div><span>Sunucu hatası</span><strong className={system.api.errorRate ? 'metric-critical' : 'metric-good'}>%{system.api.errorRate}</strong><small>HTTP 5xx oranı</small></div><div><span>Aktif istek</span><strong>{system.api.activeRequests}</strong><small>Şu anda işleniyor</small></div><div><span>Bellek</span><strong>{system.api.memory.rssMb} MB</strong><small>Heap {system.api.memory.heapUsedMb} MB</small></div></div>
        <div className="traffic-chart"><div className="traffic-chart-heading"><span>15 dakikalık istek akışı</span><small>Son kontrol {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(system.checkedAt))}</small></div><div className="traffic-bars">{system.api.trend.map((point) => {
          const peak = Math.max(1, ...system.api.trend.map((entry) => entry.requestCount));
          return <span key={point.minute} className={point.errorCount ? 'has-error' : ''} style={{ height: `${Math.max(7, (point.requestCount / peak) * 100)}%` }} title={`${new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(point.minute))}: ${point.requestCount} istek, ${point.p95Ms} ms p95`}><i className="sr-only">{point.requestCount} istek</i></span>;
        })}</div></div>
        {systemMessage && <p className="system-stale" role="status">Son yenileme başarısız: {systemMessage}. Son başarılı ölçüm gösteriliyor.</p>}
      </> : systemLoading && <div className="system-loading"><div className="spinner" /><span>Servisler kontrol ediliyor…</span></div>}
    </section>}
    <section className="admin-grid">
      <article className="admin-panel"><h2>Davet kodları</h2>{me?.role === 'ADMIN' && <form className="inline-form" onSubmit={createInvite}><label><span className="sr-only">Etiket</span><input name="label" placeholder="Etiket" maxLength={80} /></label><label><span className="sr-only">Kullanım kotası</span><input name="maxUses" type="number" min="1" max="10000" defaultValue="10" /></label><button className="primary-button" disabled={busyAction === 'invite'}>{busyAction === 'invite' ? 'Oluşturuluyor…' : 'Oluştur'}</button></form>}{createdCode && <p className="secret-result">Yeni kod: <strong>{createdCode}</strong><br />Bu değer tekrar gösterilmez.</p>}<div className="table-list">{invites.length ? invites.map((invite) => <div key={invite.id}><span>{invite.prefix}… {invite.label}</span><b>{invite.useCount}/{invite.maxUses}</b></div>) : <p>Henüz davet kodu yok.</p>}</div></article>
      <article className="admin-panel"><h2>Açık şikâyetler</h2><div className="table-list">{reports.length ? reports.map((report) => <div key={report.id}><span>{report.targetType}: {report.reason}</span><b>{report.status}</b></div>) : <p>Açık şikâyet yok.</p>}</div></article>
      <article className="admin-panel full-panel user-management"><div className="admin-panel-heading"><div><h2>Kullanıcı yönetimi</h2><p>Admin ekle veya kaldır, erişimi durdur, parola sıfırlama e-postası gönder ve hesabı sil.</p></div><label className="admin-search"><span className="sr-only">Kullanıcı ara</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad, kullanıcı adı veya e-posta ara" /></label></div><div className="user-table">{filteredUsers.length ? filteredUsers.map((account) => {
        const self = account.id === me?.id;
        const deleted = account.status === 'DELETED';
        const rowBusy = busyAction.endsWith(account.id);
        return <div className="user-row" key={account.id}><div className="user-identity"><span className="user-avatar">{(account.profile?.displayName ?? account.email).charAt(0).toUpperCase()}</span><span><strong>{account.profile?.displayName ?? 'İsimsiz kullanıcı'} {self && <em>Sen</em>}</strong><small>{account.profile?.username ? `@${account.profile.username} · ` : ''}{account.email}</small></span></div><div className="user-controls"><span className={`status-pill status-${account.status.toLowerCase()}`}>{statusLabels[account.status]}</span><label><span className="sr-only">{account.email} rolü</span><select value={account.role} disabled={me?.role !== 'ADMIN' || self || deleted || rowBusy} onChange={(event) => void setRole(account, event.target.value as AdminUser['role'])}><option value="USER">Kullanıcı</option><option value="MODERATOR">Moderatör</option><option value="ADMIN">Admin</option></select></label>{me?.role === 'ADMIN' && !deleted && <div className="user-actions"><button className="text-button" disabled={rowBusy} onClick={() => void resetPassword(account)}>Parola sıfırla</button>{!self && <button className="text-button" disabled={rowBusy} onClick={() => void setStatus(account)}>{account.status === 'SUSPENDED' ? 'Geri aç' : 'Askıya al'}</button>}{!self && <button className="text-button danger-text" disabled={rowBusy} onClick={() => void deleteUser(account)}>Kullanıcıyı sil</button>}</div>}</div></div>;
      }) : <p className="admin-empty">Aramana uyan kullanıcı bulunamadı.</p>}</div></article>
    </section>
  </main>;
}
