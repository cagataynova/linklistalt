"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authorizedApi } from "@/lib/api";
import type { List } from "@/lib/types";

export function CreateListForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const list = await authorizedApi<List>("/lists", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      router.push(
        list.visibility === "PUBLIC"
          ? `/lists/${list.id}`
          : `/dashboard/lists/${list.id}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Liste oluşturulamadı.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="auth-card wide-form" onSubmit={submit}>
      <div className="eyebrow">YENİ KOLEKSİYON</div>
      <h1>Liste oluştur</h1>
      <label>
        Başlık
        <input name="title" required maxLength={100} />
      </label>
      <label>
        Açıklama
        <textarea name="description" rows={4} maxLength={500} />
      </label>
      <label>
        Kategori
        <input name="category" required maxLength={50} />
      </label>
      <label>
        Görünürlük
        <select name="visibility" defaultValue="PRIVATE">
          <option value="PRIVATE">Gizli</option>
          <option value="UNLISTED">Bağlantıya özel</option>
          <option value="PUBLIC">Herkese açık</option>
        </select>
      </label>
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
      <button className="primary-button" disabled={busy}>
        {busy ? "Oluşturuluyor…" : "Listeyi oluştur"}
      </button>
    </form>
  );
}
