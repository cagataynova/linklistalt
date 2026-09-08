import type { Metadata } from "next";
import { AuthenticatedListDetail } from "@/components/authenticated-list-detail";

export const metadata: Metadata = { title: "Listem" };

export default async function DashboardListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AuthenticatedListDetail id={(await params).id} />;
}
