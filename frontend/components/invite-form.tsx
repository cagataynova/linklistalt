"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authorizedApi, publicApi } from "@/lib/api";
import { auth } from "@/lib/firebase";

type Ticket = { signupTicket: string; expiresInSeconds: number };

export function InviteForm() {
  const router = useRouter();
  const [ticket, setTicket] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function claim(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await publicApi<Ticket>("/invites/ticket", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      sessionStorage.setItem("linklist-signup-ticket", result.signupTicket);
      setTicket(result.signupTicket);
      setMessage("Davet doğrulandı. Şimdi hesabını oluştur.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Davet doğrulanamadı.",
      );
    } finally {
      setBusy(false);
    }
  }
  function validProfile() {
    const name = displayName.trim();
    if (name.length < 2) {
      setMessage("Görünen ad en az 2 karakter olmalı.");
      return false;
    }
    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
      setMessage(
        "Kullanıcı adı 3-30 karakter olmalı; yalnızca küçük harf, sayı, _ ve - kullanılabilir.",
      );
      return false;
    }
    return true;
  }
  async function emailSignup(event: FormEvent) {
    event.preventDefault();
    if (!validProfile()) return;
    setBusy(true);
    setMessage("");
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      sessionStorage.setItem(
        "linklist-signup-profile",
        JSON.stringify({ username, displayName: displayName.trim() }),
      );
      await sendEmailVerification(credential.user);
      setMessage(
        "Doğrulama e-postası gönderildi. Bağlantıyı açtıktan sonra profilini tamamla.",
      );
      router.push("/onboarding");
    } catch {
      setMessage(
        "Hesap oluşturulamadı. E-posta kullanımda olabilir veya parola çok kısa olabilir.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function googleSignup() {
    if (!validProfile()) return;
    setBusy(true);
    setMessage("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await authorizedApi("/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          signupTicket: ticket,
          username,
          displayName: displayName.trim(),
        }),
      });
      sessionStorage.removeItem("linklist-signup-ticket");
      sessionStorage.removeItem("linklist-signup-profile");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Google kaydı tamamlanamadı. Lütfen tekrar dene.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ticket)
    return (
      <form className="auth-card" onSubmit={claim}>
        <div className="eyebrow">DAVETLİ BETA</div>
        <h1>Davet kodunu gir</h1>
        <p>
          Küçük bir grupla başladığımız için yeni hesaplar davet koduyla
          açılıyor.
        </p>
        <label>
          Davet kodu
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            autoComplete="off"
          />
        </label>
        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          Kodu doğrula
        </button>
      </form>
    );
  return (
    <form className="auth-card" onSubmit={emailSignup}>
      <div className="eyebrow">DAVET DOĞRULANDI</div>
      <h1>Hesabını oluştur</h1>
      <p>Google ile devam ettiğinde profilin de aynı işlemde oluşturulur.</p>
      <label>
        Görünen ad
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={80}
          required
          autoComplete="name"
        />
      </label>
      <label>
        Kullanıcı adı
        <div className="input-prefix">
          <span>@</span>
          <input
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
              )
            }
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9][a-z0-9_-]{2,29}"
            required
            autoComplete="username"
          />
        </div>
      </label>
      <label>
        E-posta
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        Parola
        <input
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </label>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <button className="primary-button" disabled={busy}>
        {busy ? "Hesap oluşturuluyor…" : "E-posta ile kaydol"}
      </button>
      <button
        type="button"
        className="secondary-button"
        disabled={busy}
        onClick={googleSignup}
      >
        {busy ? "Kayıt tamamlanıyor…" : "Google ile kaydol"}
      </button>
    </form>
  );
}
