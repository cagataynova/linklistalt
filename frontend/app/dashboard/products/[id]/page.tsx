import type { Metadata } from "next";
import { AuthenticatedProductDetail } from "@/components/authenticated-product-detail";

export const metadata: Metadata = { title: "Ürünüm" };

export default async function DashboardProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AuthenticatedProductDetail id={(await params).id} />;
}
