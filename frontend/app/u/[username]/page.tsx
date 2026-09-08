import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { ApiRequestError, serverApi } from "@/lib/api";
import type { Profile } from "@/lib/types";

type Props = { params: Promise<{ username: string }> };
const load = cache(async (username: string) => {
  try {
    return await serverApi<Profile>(
      `/profiles/${encodeURIComponent(username)}`,
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await load((await params).username);
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description:
      profile.bio ??
      `${profile.displayName} tarafından hazırlanan LinkList koleksiyonları.`,
    openGraph: { images: profile.avatarUrl ? [profile.avatarUrl] : undefined },
  };
}
export default async function ProfilePage({ params }: Props) {
  return <ProfileView profile={await load((await params).username)} />;
}
