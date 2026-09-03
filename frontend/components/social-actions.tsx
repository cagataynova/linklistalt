'use client';

import { useState, type FormEvent } from 'react';
import { authorizedApi } from '@/lib/api';
import { useAuth } from './auth-provider';

type Props = { targetType: 'USER' | 'PROFILE' | 'LIST' | 'PRODUCT'; targetId: string; followUserId?: string; listId?: string; blockUserId?: string };
export function SocialActions({ targetType, targetId, followUserId, listId, blockUserId }: Props) {
  const { user } = useAuth(); const [message, setMessage] = useState(''); const [following, setFollowing] = useState(false); const [liked, setLiked] = useState(false); const [blocked, setBlocked] = useState(false); const [reportOpen, setReportOpen] = useState(false); const [reason, setReason] = useState('');
  if (!user) return null;
  async function toggle(path: string, active: boolean, setter: (value: boolean) => void) { try { await authorizedApi(path, { method: active ? 'DELETE' : 'POST' }); setter(!active); setMessage(''); } catch (error) { setMessage(error instanceof Error ? error.message : 'İşlem tamamlanamadı.'); } }
  async function report(event: FormEvent) { event.preventDefault(); if (reason.trim().length < 3) return; try { await authorizedApi('/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason: reason.trim() }) }); setMessage('Şikâyetin inceleme kuyruğuna alındı.'); setReason(''); setReportOpen(false); } catch (error) { setMessage(error instanceof Error ? error.message : 'Şikâyet gönderilemedi.'); } }
  return <div className="social-actions">{followUserId && <button className="secondary-button" onClick={() => toggle(`/social/follows/${followUserId}`, following, setFollowing)}>{following ? 'Takibi bırak' : 'Takip et'}</button>}{listId && <button className="secondary-button" onClick={() => toggle(`/social/list-likes/${listId}`, liked, setLiked)}>{liked ? 'Beğenildi' : 'Beğen'}</button>}{blockUserId && <button className="text-button" onClick={() => toggle(`/blocks/${blockUserId}`, blocked, setBlocked)}>{blocked ? 'Engeli kaldır' : 'Engelle'}</button>}<button className="text-button" aria-expanded={reportOpen} onClick={() => setReportOpen(!reportOpen)}>Şikâyet et</button>{reportOpen && <form className="report-form" onSubmit={report}><label>Şikâyet nedeni<input autoFocus minLength={3} maxLength={100} required value={reason} onChange={(event) => setReason(event.target.value)} /></label><button className="secondary-button">Gönder</button></form>}{message && <span className="action-message" role="status">{message}</span>}</div>;
}
