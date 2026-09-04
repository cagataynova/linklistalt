import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Bağlantıyı bırak",
    copy: "Sevdiğin ürünün bağlantısını ekle; LinkList adını, fiyatını ve görselini senin için hazırlasın.",
  },
  {
    number: "02",
    title: "Kendi düzenini kur",
    copy: "Ürünlerini ev, stil, hediye ya da aklındaki başka bir fikir için ayrı listelerde biriktir.",
  },
  {
    number: "03",
    title: "İstediğin kadar paylaş",
    copy: "Listeni herkese aç, yalnız bağlantıyı bilenlerle paylaş veya tamamen kendine sakla.",
  },
];

const stores = ["Trendyol", "Hepsiburada", "LC Waikiki", "Amazon.com.tr"];

export default function Home() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">DAVETLİ BETA</div>
          <h1>Beğendiklerin kaybolmasın.</h1>
          <p>
            Farklı mağazalarda bulduğun ürünleri tek yerde topla. Listelerini
            kendi zevkine göre düzenle, sakla ve paylaş.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/invite">
              Davet koduyla katıl
            </Link>
            <Link className="secondary-button" href="/login">
              Hesabına gir
            </Link>
          </div>
          <div className="hero-note">
            <span aria-hidden="true">✓</span>
            Reklamsız, sade ve kontrolü sende.
          </div>
        </div>

        <div
          className="hero-showcase"
          aria-label="Örnek bir LinkList koleksiyonu"
        >
          <div className="showcase-card showcase-main">
            <div className="showcase-image">
              <Image
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=85"
                alt="Sade ve sıcak tonlarda bir yaşam alanı"
                fill
                priority
                sizes="(max-width: 760px) 82vw, 38vw"
              />
            </div>
            <div className="showcase-copy">
              <span>EV · 12 ÜRÜN</span>
              <strong>Yeni ev için</strong>
              <small>Sakin, sıcak ve uzun ömürlü parçalar</small>
            </div>
          </div>
          <div className="showcase-card showcase-float">
            <div className="showcase-thumb">
              <Image
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=420&q=85"
                alt="Ahşap çalışma masası"
                fill
                sizes="120px"
              />
            </div>
            <div>
              <span>ÇALIŞMA KÖŞESİ</span>
              <strong>Meşe masa</strong>
              <small>Kaydedildi</small>
            </div>
          </div>
          <div className="showcase-saved" aria-hidden="true">
            ♥
          </div>
        </div>
      </section>

      <section className="landing-proof" aria-label="Desteklenen mağazalar">
        <span>İlk günden birlikte çalıştığımız mağazalar</span>
        <div>
          {stores.map((store) => (
            <strong key={store}>{store}</strong>
          ))}
        </div>
      </section>

      <section className="landing-section how-it-works">
        <div className="landing-section-heading">
          <div className="eyebrow">NASIL ÇALIŞIR?</div>
          <h2>Bir bağlantıdan, sana ait bir koleksiyona.</h2>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-feature">
        <div className="privacy-visual" aria-hidden="true">
          <div className="visibility-option selected">
            <span>●</span>
            <div>
              <strong>Yalnızca ben</strong>
              <small>Tamamen kişisel</small>
            </div>
          </div>
          <div className="visibility-option">
            <span>↗</span>
            <div>
              <strong>Bağlantıya özel</strong>
              <small>Linki bilenler görebilir</small>
            </div>
          </div>
          <div className="visibility-option">
            <span>◎</span>
            <div>
              <strong>Herkese açık</strong>
              <small>Profilinde görünür</small>
            </div>
          </div>
        </div>
        <div className="privacy-copy">
          <div className="eyebrow">PAYLAŞIM SENİN KARARIN</div>
          <h2>Her liste için doğru görünürlük.</h2>
          <p>
            Hediye fikirlerini kendine sakla, ev listenin bağlantısını
            arkadaşına gönder veya seçkini profilinde herkese aç.
          </p>
        </div>
      </section>

      <section className="landing-cta">
        <div className="eyebrow">KÜÇÜK BİR GRUPLA BAŞLIYORUZ</div>
        <h2>İnternette beğendiklerin için sakin bir yer aç.</h2>
        <p>
          Davet kodun varsa koleksiyonunu birkaç dakika içinde oluşturmaya
          başlayabilirsin.
        </p>
        <Link className="primary-button" href="/invite">
          LinkList’e katıl
        </Link>
      </section>
    </main>
  );
}
