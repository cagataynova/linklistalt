"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError, authorizedApi } from "@/lib/api";
import type { List } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ListDetail } from "./list-detail";

export function AuthenticatedListDetail({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [list, setList] = useState<List | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void authorizedApi<List>(`/lists/${encodeURIComponent(id)}`)
      .then((value) => {
        if (active) setList(value);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof ApiRequestError && error.status === 404
            ? "Bu liste bulunamadı veya artık erişilebilir değil."
            : error instanceof Error
              ? error.message
              : "Liste yüklenemedi.",
        );
      });
    return () => {
      active = false;
    };
  }, [id, loading, user]);

  if (loading || (user && !list && !message))
    return (
      <main className="state-page" aria-busy="true">
        <div className="spinner" aria-label="Liste yükleniyor" />
      </main>
    );
  if (list) return <ListDetail list={list} ownerView />;
  return (
    <main className="state-page">
      <div className="eyebrow">GİZLİ İÇERİK</div>
      <h1>Bu listeye erişilemiyor.</h1>
      <p>{message || "Liste gizli olabilir. Sahibiysen hesabına giriş yap."}</p>
      <Link className="primary-button" href={user ? "/dashboard" : "/login"}>
        {user ? "Listelerime dön" : "Giriş yap"}
      </Link>
    </main>
  );
}
