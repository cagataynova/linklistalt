"use client";

import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiRequestError, authorizedApi } from "@/lib/api";
import { auth } from "@/lib/firebase";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueAfterSignIn() {
    try {
      await authorizedApi("/me");
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        const hasSignupTicket = Boolean(
          sessionStorage.getItem("linklist-signup-ticket"),
        );
        router.replace(hasSignupTicket ? "/onboarding" : "/invite");
        return;
      }
      throw error;
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await continueAfterSignIn();
    } catch {
      setMessage("E-posta veya parola doğrulanamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setMessage("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await continueAfterSignIn();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Google ile giriş tamamlanamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email) {
      setMessage("Önce e-posta adresini yaz.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Parola yenileme bağlantısı gönderildi.");
    } catch {
      setMessage("Parola yenileme bağlantısı gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <header className="auth-heading">
        <div className="eyebrow">TEKRAR HOŞ GELDİN</div>
        <h1>Hesabına gir</h1>
        <p>Listelerine kaldığın yerden devam et.</p>
      </header>
      <div className="auth-fields">
        <label>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="ornek@eposta.com"
          />
        </label>
        <label>
          Parola
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Parolan"
          />
        </label>
      </div>
      {message && (
        <p className="form-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
      <button className="primary-button auth-submit" disabled={busy}>
        {busy ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <div className="auth-divider" aria-hidden="true">
        <span>veya</span>
      </div>
      <button
        type="button"
        className="secondary-button auth-google"
        onClick={google}
        disabled={busy}
      >
        <span className="google-mark" aria-hidden="true">
          G
        </span>
        Google ile devam et
      </button>
      <button
        type="button"
        className="text-button auth-reset"
        onClick={reset}
        disabled={busy}
      >
        Parolamı unuttum
      </button>
    </form>
  );
}
