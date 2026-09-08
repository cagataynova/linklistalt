import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  href,
}: {
  product: Product;
  href?: string;
}) {
  const image = product.images?.[0];
  return (
    <article className="product-card">
      <Link className="product-image" href={href ?? `/products/${product.id}`}>
        {image ? (
          <Image
            src={image.publicUrl}
            alt={image.altText ?? product.name}
            fill
            sizes="(max-width: 760px) 50vw, 25vw"
          />
        ) : (
          <span className="product-placeholder">Fotoğraf eklenmemiş</span>
        )}
      </Link>
      <div className="product-copy">
        <span>{product.brand ?? "Marka belirtilmemiş"}</span>
        <h3>{product.name}</h3>
        <p>
          {product.price
            ? new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: product.currency,
              }).format(Number(product.price))
            : "Fiyat belirtilmemiş"}
        </p>
      </div>
    </article>
  );
}
