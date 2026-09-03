import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: { default: 'LinkList', template: '%s · LinkList' }, description: 'Beğendiğin ürünleri topla, düzenle ve kendi profilinde paylaş.', openGraph: { title: 'LinkList', description: 'Beğendiklerin sana ait bir yerde.', type: 'website' }, twitter: { card: 'summary_large_image' } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="tr"><body><AuthProvider><SiteHeader />{children}</AuthProvider></body></html>; }
