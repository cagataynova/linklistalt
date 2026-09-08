import Link from "next/link";
import type { List } from "@/lib/types";
import { ProductCard } from "./product-card";
import { SocialActions } from "./social-actions";

export function ListDetail({
  list,
  ownerView = false,
}: {
  list: List;
  ownerView?: boolean;
}) {
  const products = list.listProducts?.map((row) => row.product) ?? [];
  const addProductHref = `/dashboard/products/new?listId=${encodeURIComponent(list.id)}`;

  return (
    <main className="detail-page">
      <header className="detail-hero">
        <div className="eyebrow">
          {list.owner?.profile ? (
            <Link href={`/u/${list.owner.profile.username}`}>
              @{list.owner.profile.username}
            </Link>
          ) : (
            "LinkList"
          )}
        </div>
        <h1>{list.title}</h1>
        <p>
          {list.description ?? "Bu liste için henüz bir açıklama eklenmemiş."}
        </p>
        <div className="stats">
          <span>
            <b>{products.length}</b> ürün
          </span>
          <span>
            <b>{list._count?.likes ?? 0}</b> beğeni
          </span>
        </div>
        <div className="detail-actions">
          <Link className="primary-button" href={addProductHref}>
            Ürün ekle
          </Link>
          <SocialActions
            targetType="LIST"
            targetId={list.id}
            listId={list.id}
          />
        </div>
      </header>
      {products.length ? (
        <section className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={ownerView ? `/dashboard/products/${product.id}` : undefined}
            />
          ))}
        </section>
      ) : (
        <section className="empty-list-state">
          <h2>Bu liste henüz boş</h2>
          <p>İlk ürün bağlantısını ekleyerek bu listeyi doldurmaya başla.</p>
          <Link className="primary-button" href={addProductHref}>
            İlk ürünü ekle
          </Link>
        </section>
      )}
    </main>
  );
}
