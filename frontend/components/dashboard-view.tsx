"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, authorizedApi } from "@/lib/api";
import type { List, Me } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ListCard } from "./list-card";
import { DeleteAccount } from "./delete-account";

export function DashboardView() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [message, setMessage] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const load = useCallback(async () => {
    await Promise.resolve();
    setDataLoading(true);
    setMessage("");
    try {
      const [profile, rows] = await Promise.all([
        authorizedApi<Me>("/me"),
        authorizedApi<List[]>("/lists"),
      ]);
      setMe(profile);
      setLists(rows);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 401 &&
        sessionStorage.getItem("linklist-signup-ticket")
      ) {
        router.replace("/onboarding");
        return;
      }
      setMessage(error instanceof Error ? error.message : "Veriler alınamadı.");
    } finally {
      setDataLoading(false);
    }
  }, [router]);
  useEffect(() => {
    if (loading || !user) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, loading, user]);
  if (loading || (user && (dataLoading || (!me && !message))))
    return (
      <main className="state-page" aria-busy="true">
        <div className="spinner" aria-label="Hesap yükleniyor" />
      </main>
    );
  if (!user)
    return (
      <main className="state-page">
        <h1>Listelerini görmek için giriş yap.</h1>
        <Link className="primary-button" href="/login">
          Giriş yap
        </Link>
      </main>
    );
  if (message)
    return (
      <main className="state-page">
        <h1>Hesabın hazırlanamadı.</h1>
        <p>{message}</p>
        <div className="state-actions">
          {message.includes("oluşturulmamış") && (
            <Link className="primary-button" href="/invite">
              Davet koduyla kaydı tamamla
            </Link>
          )}
          <button className="secondary-button" onClick={() => void load()}>
            Tekrar dene
          </button>
        </div>
      </main>
    );
  return (
    <main>
      <section className="profile-wrap">
        <div className="profile-head">
          <div className="profile-avatar">
            {me?.profile.displayName?.[0] ?? "?"}
          </div>
          <div className="profile-copy">
            <div className="eyebrow">@{me?.profile.username}</div>
            <h1>{me?.profile.displayName ?? "Profil yükleniyor"}</h1>
            <p>{me?.profile.bio ?? "Koleksiyonlarını oluşturmaya başla."}</p>
          </div>
          <div className="profile-actions">
            <Link className="primary-button" href="/dashboard/products/new">
              Ürün ekle
            </Link>
          </div>
        </div>
      </section>
      <section className="collections-wrap">
        <div className="collections-head">
          <h2>Listelerim</h2>
          <Link className="secondary-button" href="/dashboard/lists/new">
            Liste oluştur
          </Link>
        </div>
        {lists.length ? (
          <div className="collection-stack">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        ) : (
          <div className="empty-list-state">
            <h2>İlk listeni oluştur</h2>
            <p>Kaydetmek istediğin ürünler için sakin bir köşe aç.</p>
            <Link className="primary-button" href="/dashboard/lists/new">
              Liste oluştur
            </Link>
          </div>
        )}
        <DeleteAccount />
      </section>
    </main>
  );
}
