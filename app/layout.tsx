import type { Metadata } from 'next';
import { Bricolage_Grotesque, Martian_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

// Self-hosted at build time by next/font: no runtime request to Google.
const sans = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-sans-src',
});
const mono = Martian_Mono({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-mono-src',
});

const TITLE = 'Jairaj Saraf · AI engineer';
const DESCRIPTION =
  'AI engineer. LLM features on top of data, with the evaluations published, including the runs that missed the bar.';

// Vercel sets VERCEL_PROJECT_PRODUCTION_URL (a bare domain, no protocol) at build time, so
// the og:image URL is absolute there. Local builds fall back to localhost.
// vercel.com/docs/environment-variables/system-environment-variables
const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(prodHost ? `https://${prodHost}` : 'http://localhost:3000'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
  },
};

// Runs before first paint. It marks JS-capable browsers ("js"), so the CI draw-in can start from its hidden
// state; without JS the sheet is drawn in its end state. If the sheet code has not mounted ("hy", set in
// Sheet.tsx) about 800 ms after first paint, it adds "still": the marks show in their end state, and the
// draw-in does not replay when the JS arrives.
const jsFlag =
  "(function(d){d.classList.add('js');var t=function(){setTimeout(function(){if(!d.classList.contains('hy'))d.classList.add('still')},800)};" +
  "try{new PerformanceObserver(function(l,o){o.disconnect();t()}).observe({type:'paint',buffered:true})}catch(e){t()}})(document.documentElement)";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
