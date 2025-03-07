"use client";

import React from 'react';
import { AssetDetails } from './AssetDetails';
import Layout from '../layout/Layout';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Mock data for assets - in a real app, this would come from an API or blockchain
export const assetsData = {
  etn: {
    symbol: 'ETN',
    name: 'Electroneum',
    icon: '/assets/etn-logo.png',
    depositAPY: 2.5,
    borrowAPY: 4.8,
    totalSupplied: '2,500,000',
    totalBorrowed: '1,200,000',
    liquidity: '1,300,000',
    price: 0.015,
    priceChange: 1.45,
    canBeCollateral: true,
  },
  usdc: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '/assets/usdc-logo.png',
    depositAPY: 3.2,
    borrowAPY: 5.5,
    totalSupplied: '1,800,000',
    totalBorrowed: '900,000',
    liquidity: '900,000',
    price: 1.0,
    priceChange: 0.05,
    canBeCollateral: true,
  },
  usdt: {
    symbol: 'USDT',
    name: 'Tether',
    icon: '/assets/usdt-logo.png',
    depositAPY: 3.1,
    borrowAPY: 5.2,
    totalSupplied: '1,500,000',
    totalBorrowed: '750,000',
    liquidity: '750,000',
    price: 1.0,
    priceChange: 0.01,
    canBeCollateral: true,
  },
};

interface AssetDetailsClientProps {
  symbol: string;
}

export default function AssetDetailsClient({ symbol }: AssetDetailsClientProps) {
  const normalizedSymbol = symbol.toLowerCase();
  const asset = assetsData[normalizedSymbol as keyof typeof assetsData];
  
  // If asset not found
  if (!asset) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Link href="/app/markets" className="flex items-center text-blue-600 mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Markets
          </Link>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600">Market Not Found</h1>
            <p className="mt-4">The market you are looking for does not exist.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/app/markets" className="flex items-center text-blue-600 mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Markets
        </Link>
        
        <AssetDetails {...asset} />
      </div>
    </Layout>
  );
} 