import Image from 'next/image';
import Link from 'next/link';
import type { List } from '@/lib/types';

export function ListCard({ list }: { list: List }) {
  const products = list.listProducts?.map((entry) => entry.product) ?? [];
  return <article className="collection-card"><Link className="collection-collage" href={`/lists/${list.id}`}><span className={`mosaic mosaic-${Math.min(products.length, 4)}`}>{products.slice(0, 4).map((product) => { const image = product.images?.[0]; return image ? <span className="mosaic-tile" key={product.id}><Image src={image.publicUrl} alt="" fill sizes="(max-width:760px) 50vw, 20vw" /></span> : null; })}{products.length === 0 && <span className="product-placeholder">İlk ürününü ekle</span>}</span></Link><div className="collection-info"><div className="eyebrow">{list._count?.listProducts ?? products.length} ürün · {list.category}</div><h3><Link href={`/lists/${list.id}`}>{list.title}</Link></h3><p>{list.description}</p><div className="collection-foot"><Link href={`/lists/${list.id}`}>Listeyi gör →</Link></div></div></article>;
}
