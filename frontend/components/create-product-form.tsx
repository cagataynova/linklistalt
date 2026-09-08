"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authorizedApi } from "@/lib/api";
import type { ExtractedProduct, List, Product } from "@/lib/types";

export function CreateProductForm({
  initialListId,
}: {
  initialListId?: string;
}) {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [form, setForm] = useState({
    listId: "",
    sourceUrl: "",
    name: "",
    brand: "",
    price: "",
    currency: "TRY",
    note: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [listsLoading, setListsLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    authorizedApi<List[]>("/lists")
      .then((rows) => {
        setLists(rows);
        const selected =
          rows.find((list) => list.id === initialListId) ?? rows[0];
        if (selected) setForm((value) => ({ ...value, listId: selected.id }));
      })
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Listeler alınamadı.",
        ),
      )
      .finally(() => setListsLoading(false));
  }, [initialListId]);
  async function extract() {
    setBusy(true);
    setMessage("");
    try {
      const data = await authorizedApi<ExtractedProduct>("/products/extract", {
        method: "POST",
        body: JSON.stringify({ url: form.sourceUrl }),
      });
      setForm((value) => ({
        ...value,
        sourceUrl: data.sourceUrl,
        name: data.name ?? value.name,
        brand: data.brand ?? "",
        price: data.price ?? "",
        currency: data.currency ?? "TRY",
      }));
      setImages(data.images);
    } catch (error) {
      setMessage(
        `${error instanceof Error ? error.message : "Bilgi alınamadı."} Alanları elle doldurabilirsin.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const product = await authorizedApi<Product>("/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          brand: form.brand || undefined,
          price: form.price || undefined,
          note: form.note || undefined,
          images: images.slice(0, 4).map((sourceUrl) => ({ sourceUrl })),
        }),
      });
      router.push(`/dashboard/products/${product.id}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ürün kaydedilemedi.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="form-card wide-form" onSubmit={submit}>
      <div>
        <div className="eyebrow">Yeni ürün</div>
        <h1>Bir bağlantıyı listene ekle</h1>
        <p>
          Trendyol, Hepsiburada, LC Waikiki ve Amazon Türkiye bağlantılarını
          okuyabiliriz.
        </p>
      </div>
      <label>
        Ürün bağlantısı
        <div className="inline-field">
          <input
            type="url"
            required
            value={form.sourceUrl}
            onChange={(event) =>
              setForm({ ...form, sourceUrl: event.target.value })
            }
            placeholder="https://..."
          />
          <button
            className="secondary-button"
            type="button"
            disabled={busy || !form.sourceUrl}
            onClick={extract}
          >
            Bilgileri getir
          </button>
        </div>
      </label>
      {images[0] && (
        <div className="extracted-preview">
          <Image src={images[0]} alt="Ürün önizlemesi" fill sizes="240px" />
        </div>
      )}
      <label>
        Liste
        <select
          required
          disabled={listsLoading}
          value={form.listId}
          onChange={(event) => setForm({ ...form, listId: event.target.value })}
        >
          <option value="">
            {listsLoading ? "Listeler yükleniyor…" : "Liste seç"}
          </option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.title}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Ürün adı
          <input
            required
            maxLength={160}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Marka
          <input
            maxLength={100}
            value={form.brand}
            onChange={(event) =>
              setForm({ ...form, brand: event.target.value })
            }
          />
        </label>
        <label>
          Fiyat
          <input
            inputMode="decimal"
            pattern="\d{1,10}([.]\d{1,2})?"
            value={form.price}
            onChange={(event) =>
              setForm({ ...form, price: event.target.value })
            }
            placeholder="1299.90"
          />
        </label>
        <label>
          Para birimi
          <input
            maxLength={3}
            value={form.currency}
            onChange={(event) =>
              setForm({ ...form, currency: event.target.value.toUpperCase() })
            }
          />
        </label>
      </div>
      <label>
        Not
        <textarea
          maxLength={500}
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
        />
      </label>
      {!listsLoading && !lists.length && (
        <p className="form-message">Önce bir liste oluşturmalısın.</p>
      )}
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
      <button
        className="primary-button"
        disabled={busy || listsLoading || !lists.length}
      >
        {busy ? "İşleniyor…" : "Ürünü kaydet"}
      </button>
    </form>
  );
}
