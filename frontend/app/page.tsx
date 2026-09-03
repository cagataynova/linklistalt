import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return <main className="landing"><section className="hero"><div><div className="eyebrow">DAVETLİ BETA</div><h1>Beğendiklerin kaybolmasın.</h1><p>Farklı mağazalardaki ürünleri kişisel listelerinde topla, düzenle ve istediğin kadarını paylaş.</p><div className="hero-actions"><Link className="primary-button" href="/invite">Davet koduyla katıl</Link><Link className="secondary-button" href="/login">Hesabına gir</Link></div></div><div className="hero-image"><Image src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85" alt="Sakin tasarımlı bir yaşam alanı" fill priority sizes="(max-width:760px) 100vw, 50vw" /></div></section></main>;
}
