import type { Metadata } from 'next';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Assistant } from '@/components/assistant';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { withBasePath } from '@/lib/base-path';
import './globals.css';
import './travel.css';
import './stories.css';
import './assistant.css';

const sans = Manrope({ variable: '--font-sans', subsets: ['latin'] });
const serif = Cormorant_Garamond({
  variable: '--font-serif', subsets: ['latin'], weight: ['500', '600'], style: ['normal', 'italic'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
const socialImage = siteUrl ? {
  url: `${siteUrl}/time2graze-whatsapp-card.png`,
  width: 600,
  height: 315,
  type: 'image/png',
  alt: 'Time2Graze Brazil Workshop · 14–18 September 2026 · Goiânia, Brazil',
} : null;

export const metadata: Metadata = {
  title: 'Time2Graze Brazil Workshop · 14–18 September 2026',
  description: 'Internal Time2Graze technical workshop in Goiânia, Brazil, focused on data development, decision support and grazing management.',
  icons: { icon: withBasePath('/favicon.svg') },
  openGraph: {
    title: 'Time2Graze Brazil Workshop',
    description: 'Internal technical workshop · 14–18 September 2026 · Goiânia, Brazil.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Time2Graze Brazil Workshop',
    images: socialImage ? [socialImage] : [],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Time2Graze Brazil Workshop',
    description: '14–18 September 2026 · Goiânia, Brazil',
    images: socialImage ? [{ url: socialImage.url, alt: socialImage.alt }] : [],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${serif.variable}`}>
        {/* Ahead of the header, so the first tab stop on every page skips the
            navigation rather than walking through it. */}
        <a className="skip-link" href="#content">Skip to the content</a>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
        {/* Over the page, never a destination of its own. */}
        <Assistant />
      </body>
    </html>
  );
}
