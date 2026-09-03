import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product-detail';
import { serverApi } from '@/lib/api';
import type { Product } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };
async function load(id: string) { try { return await serverApi<Product>(`/products/${encodeURIComponent(id)}`); } catch { notFound(); } }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const product = await load((await params).id); return { title: product.name, description: product.note ?? `${product.name} ürün detayı.`, openGraph: { images: product.images?.[0]?.publicUrl ? [product.images[0].publicUrl] : undefined } }; }
export default async function ProductPage({ params }: Props) { return <ProductDetail product={await load((await params).id)} />; }
