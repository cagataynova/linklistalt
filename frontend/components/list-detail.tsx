import Link from 'next/link';
import type { List } from '@/lib/types';
import { ProductCard } from './product-card';
import { SocialActions } from './social-actions';

export function ListDetail({ list }: { list: List }) {
  const products = list.listProducts?.map((row) => row.product) ?? [];
  return <main className="detail-page"><header className="detail-hero"><div className="eyebrow">{list.owner?.profile ? <Link href={`/u/${list.owner.profile.username}`}>@{list.owner.profile.username}</Link> : 'LinkList'}</div><h1>{list.title}</h1><p>{list.description ?? 'Bu liste için henüz bir açıklama eklenmemiş.'}</p><div className="stats"><span><b>{products.length}</b> ürün</span><span><b>{list._count?.likes ?? 0}</b> beğeni</span></div><SocialActions targetType="LIST" targetId={list.id} listId={list.id} /></header>{products.length ? <section className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</section> : <section className="empty-list-state"><h2>Bu liste henüz boş</h2><p>Liste sahibi ürün eklediğinde burada görünecek.</p></section>}</main>;
}
