import Link from 'next/link';
export default function NotFound() { return <main className="state-page"><div className="eyebrow">404</div><h1>Bu sayfa burada değil.</h1><p>Bağlantı kaldırılmış, gizlenmiş veya yanlış olabilir.</p><Link className="primary-button" href="/">Ana sayfaya dön</Link></main>; }
