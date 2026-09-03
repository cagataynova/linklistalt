import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { CloneProduct } from './clone-product';
import { SocialActions } from './social-actions';

export function ProductDetail({ product }: { product: Product }) {
  const image = product.images?.[0];
  return <main className="product-detail"><div className="product-detail-image">{image ? <Image src={image.publicUrl} alt={image.altText ?? product.name} fill priority sizes="(max-width: 760px) 100vw, 50vw" /> : <span className="product-placeholder">Fotoğraf eklenmemiş</span>}</div><section className="product-detail-copy"><div className="eyebrow">{product.brand ?? 'Ürün'}</div><h1>{product.name}</h1><p className="detail-price">{product.price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: product.currency }).format(Number(product.price)) : 'Fiyat belirtilmemiş'}</p>{product.note && <p>{product.note}</p>}<div className="product-actions"><Link className="primary-button" href={product.sourceUrl} target="_blank" rel="noreferrer">Mağazada görüntüle</Link><CloneProduct productId={product.id} /><SocialActions targetType="PRODUCT" targetId={product.id} /></div></section></main>;
}
