"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function LandingHeroActions() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="hero-actions auth-actions-placeholder" aria-busy="true" />;
  }

  return (
    <div className="hero-actions">
      <Link
        className="primary-button"
        href={user ? "/dashboard/products/new" : "/invite"}
      >
        {user ? "Ürün ekle" : "Davet koduyla katıl"}
      </Link>
      <Link
        className="secondary-button"
        href={user ? "/dashboard" : "/login"}
      >
        {user ? "Listelerime git" : "Hesabına gir"}
      </Link>
    </div>
  );
}

export function LandingFooterAction() {
  const { user, loading } = useAuth();

  if (loading) {
    return <span className="primary-button auth-cta-placeholder" aria-busy="true" />;
  }

  return (
    <Link className="primary-button" href={user ? "/dashboard" : "/invite"}>
      {user ? "Listelerime git" : "LinkList’e katıl"}
    </Link>
  );
}
