import Image from "next/image";
import Link from "next/link";
import type { List } from "@/lib/types";

export function ListCard({ list, href }: { list: List; href?: string }) {
  const products = list.listProducts?.map((entry) => entry.product) ?? [];
  const listHref = href ?? `/lists/${list.id}`;
  return (
    <article className="collection-card">
      <Link className="collection-collage" href={listHref}>
        <span className={`mosaic mosaic-${Math.min(products.length, 4)}`}>
          {products.slice(0, 4).map((product) => {
            const image = product.images?.[0];
            return image ? (
              <span className="mosaic-tile" key={product.id}>
                <Image
                  src={image.publicUrl}
                  alt=""
                  fill
                  sizes="(max-width:760px) 50vw, 20vw"
                />
              </span>
            ) : null;
          })}
          {products.length === 0 && (
            <span className="product-placeholder">İlk ürününü ekle</span>
          )}
        </span>
      </Link>
      <div className="collection-info">
        <div className="eyebrow">
          {list._count?.listProducts ?? products.length} ürün · {list.category}
        </div>
        <h3>
          <Link href={listHref}>{list.title}</Link>
        </h3>
        <p>{list.description}</p>
        <div className="collection-foot">
          <Link href={listHref}>Listeyi gör →</Link>
        </div>
      </div>
    </article>
  );
}
