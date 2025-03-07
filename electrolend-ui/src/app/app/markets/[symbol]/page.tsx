import React from 'react';
import AssetDetailsClient, { assetsData } from '../../../../components/markets/AssetDetailsClient';

// List available symbols for static generation
export function generateStaticParams() {
  return Object.keys(assetsData).map(symbol => ({
    symbol,
  }));
}

// Market details page component (server component)
interface MarketDetailsPageProps {
  params: {
    symbol: string;
  };
}

export default function MarketDetailsPage(props: MarketDetailsPageProps) {
  // Pass the symbol to the client component
  return <AssetDetailsClient symbol={props.params.symbol} />;
} 