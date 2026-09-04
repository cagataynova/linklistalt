'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="state-page"><div className="eyebrow">BİR ŞEY TERS GİTTİ</div><h1>Sayfa yüklenemedi.</h1><p>Sunucu geçici olarak yanıt veremiyor. Lütfen biraz sonra tekrar dene.</p><button className="primary-button" onClick={reset}>Tekrar dene</button></main>; }
