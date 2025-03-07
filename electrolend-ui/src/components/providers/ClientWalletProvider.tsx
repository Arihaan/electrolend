'use client';

import React from 'react';
import { WalletProvider } from '../../context/WalletContext';

interface ClientWalletProviderProps {
  children: React.ReactNode;
}

export default function ClientWalletProvider({ children }: ClientWalletProviderProps) {
  return <WalletProvider>{children}</WalletProvider>;
} 