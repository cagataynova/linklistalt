"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError, authorizedApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ProductDetail } from "./product-detail";

export function AuthenticatedProductDetail({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void authorizedApi<Product>(`/products/${encodeURIComponent(id)}`)
      .then((value) => {
        if (active) setProduct(value);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiRequestError && error.status === 404
            ? "Bu ürün bulunamadı veya artık erişilebilir değil."
            : error instanceof Error
              ? error.message
              : "Ürün yüklenemedi.",
        );
      });
    return () => {
      active = false;
    };
  }, [id, loading, user]);

  if (loading || (user && !product && !message))
    return (
      <main className="state-page" aria-busy="true">
        <div className="spinner" aria-label="Ürün yükleniyor" />
      </main>
    );
  if (product) return <ProductDetail product={product} />;
  return (
    <main className="state-page">
      <div className="eyebrow">GİZLİ İÇERİK</div>
      <h1>Bu ürüne erişilemiyor.</h1>
      <p>
        {message ||
          "Ürün gizli bir listede olabilir. Sahibiysen hesabına giriş yap."}
      </p>
      <Link className="primary-button" href={user ? "/dashboard" : "/login"}>
        {user ? "Listelerime dön" : "Giriş yap"}
      </Link>
    </main>
  );
}
