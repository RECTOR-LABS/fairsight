import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import WalletContextProvider from '@/components/providers/WalletContextProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fairsight.rectorspace.com'),
  title: {
    default: 'FairSight — Token Trust Intelligence for Solana',
    template: '%s | FairSight',
  },
  description:
    'Analyze the people behind Solana tokens. Deployer reputation, holder quality, and reputation-weighted reviews powered by FairScale.',
  openGraph: {
    title: 'FairSight — Token Trust Intelligence',
    description: 'The Carfax for Solana tokens. Know who you\'re trusting.',
    type: 'website',
    siteName: 'FairSight',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <WalletContextProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
