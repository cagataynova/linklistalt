'use client';

import { useEffect, useState } from 'react';
import { authorizedApi } from '@/lib/api';
import type { List } from '@/lib/types';
import { useAuth } from './auth-provider';

export function CloneProduct({ productId }: { productId: string }) {
  const { user } = useAuth(); const [lists, setLists] = useState<List[]>([]); const [selected, setSelected] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { if (!user) return; authorizedApi<List[]>('/lists').then((rows) => { setLists(rows); setSelected(rows[0]?.id ?? ''); }).catch(() => setLists([])); }, [user]);
  if (!user || !lists.length) return null;
  async function clone() { try { await authorizedApi(`/products/${productId}/clone`, { method: 'POST', body: JSON.stringify({ targetListId: selected }) }); setMessage('Ürün bağımsız bir kopya olarak listene eklendi.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Ürün kaydedilemedi.'); } }
  return <div className="clone-control"><select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Hedef liste">{lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select><button className="secondary-button" onClick={clone}>Listeme kaydet</button>{message && <span role="status">{message}</span>}</div>;
}
