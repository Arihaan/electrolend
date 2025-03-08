import type { Metadata } from 'next';
import ClientWalletProvider from '../components/providers/ClientWalletProvider';
import { ToastProvider } from '../components/common/Toast';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ElectroLend - Decentralized Lending on Electroneum',
  description: 'ElectroLend is a decentralized lending platform on Electroneum, allowing users to borrow, lend, and earn interest on crypto assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <ClientWalletProvider>
              {children}
            </ClientWalletProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 