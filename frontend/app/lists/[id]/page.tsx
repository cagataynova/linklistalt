import type { Metadata } from "next";
import { AuthenticatedListDetail } from "@/components/authenticated-list-detail";
import { ListDetail } from "@/components/list-detail";
import { ApiRequestError, serverApi } from "@/lib/api";
import type { List } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };
async function loadPublic(id: string) {
  try {
    return await serverApi<List>(`/lists/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const list = await loadPublic((await params).id);
  return list
    ? {
        title: list.title,
        description: list.description ?? `${list.title} ürün koleksiyonu.`,
      }
    : { title: "Gizli liste", robots: { index: false, follow: false } };
}
export default async function ListPage({ params }: Props) {
  const id = (await params).id;
  const list = await loadPublic(id);
  return list ? (
    <ListDetail list={list} />
  ) : (
    <AuthenticatedListDetail id={id} />
  );
}
