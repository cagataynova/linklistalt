import type { Metadata } from "next";
import { AuthenticatedProductDetail } from "@/components/authenticated-product-detail";
import { ProductDetail } from "@/components/product-detail";
import { ApiRequestError, serverApi } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };
async function loadPublic(id: string) {
  try {
    return await serverApi<Product>(`/products/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await loadPublic((await params).id);
  return product
    ? {
        title: product.name,
        description: product.note ?? `${product.name} ürün detayı.`,
        openGraph: {
          images: product.images?.[0]?.publicUrl
            ? [product.images[0].publicUrl]
            : undefined,
        },
      }
    : { title: "Gizli ürün", robots: { index: false, follow: false } };
}
export default async function ProductPage({ params }: Props) {
  const id = (await params).id;
  const product = await loadPublic(id);
  return product ? (
    <ProductDetail product={product} />
  ) : (
    <AuthenticatedProductDetail id={id} />
  );
}
