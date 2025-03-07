import './globals.css';
import { Inter } from 'next/font/google';
import ClientWalletProvider from '../components/providers/ClientWalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ElectroLend - Lending Protocol on Electroneum',
  description: 'A decentralized lending protocol built on the Electroneum blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWalletProvider>
          {children}
        </ClientWalletProvider>
      </body>
    </html>
  );
} 