"use client";

import React, { useState } from 'react';
import AssetActions from './AssetActions';
import { useWallet } from '../../context/WalletContext';
import { CONTRACT_ADDRESSES } from '../../utils/web3';

// Asset props
interface AssetDetailsProps {
  symbol: string;
  name: string;
  icon: string;
  depositAPY: number;
  borrowAPY: number;
  totalSupplied: string;
  totalBorrowed: string;
  liquidity: string;
  price: number;
  priceChange: number;
  canBeCollateral: boolean;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({
  symbol,
  name,
  icon,
  depositAPY,
  borrowAPY,
  totalSupplied,
  totalBorrowed,
  liquidity,
  price,
  priceChange,
  canBeCollateral,
}) => {
  const { isConnected, getTokenBalance, getUserDeposits } = useWallet();
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');
  const [userBalance, setUserBalance] = useState<string>('0');
  const [userDeposits, setUserDeposits] = useState<string>('0');
  
  // Get token address from symbol
  const getTokenAddress = (symbol: string): string => {
    switch (symbol.toUpperCase()) {
      case 'ETN':
        return CONTRACT_ADDRESSES.ETN_TOKEN;
      case 'USDC':
        return CONTRACT_ADDRESSES.USDC_TOKEN;
      case 'USDT':
        return CONTRACT_ADDRESSES.USDT_TOKEN;
      default:
        return CONTRACT_ADDRESSES.ETN_TOKEN;
    }
  };
  
  // Load user balances when component mounts or when wallet connects
  React.useEffect(() => {
    if (isConnected) {
      loadBalances();
    }
  }, [isConnected, symbol]);
  
  // Load user balances
  const loadBalances = async () => {
    try {
      const tokenAddress = getTokenAddress(symbol);
      const balance = await getTokenBalance(tokenAddress);
      const deposits = await getUserDeposits(tokenAddress);
      
      setUserBalance(balance);
      setUserDeposits(deposits);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <img src={icon} alt={name} className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">{symbol}</span>
            <span className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${price.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Deposit APY</p>
          <p className="text-xl font-semibold text-green-600">{depositAPY.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Borrow APY</p>
          <p className="text-xl font-semibold text-blue-600">{borrowAPY.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Can be used as collateral</p>
          <p className="text-xl font-semibold">{canBeCollateral ? 'Yes' : 'No'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Total Supplied</p>
          <p className="text-xl font-semibold">{totalSupplied} {symbol}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Total Borrowed</p>
          <p className="text-xl font-semibold">{totalBorrowed} {symbol}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm">Available Liquidity</p>
          <p className="text-xl font-semibold">{liquidity} {symbol}</p>
        </div>
      </div>
      
      {isConnected && (
        <div className="mt-8 border-t pt-6">
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'deposit'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Deposit/Withdraw
            </button>
            <button
              onClick={() => setActiveTab('borrow')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'borrow'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Borrow/Repay
            </button>
          </div>
          
          {activeTab === 'deposit' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Deposit {symbol}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Wallet Balance: {parseFloat(userBalance).toFixed(4)} {symbol}
                </p>
                <AssetActions
                  assetSymbol={symbol}
                  assetName={name}
                  userBalance={userBalance}
                  maxAmount={userBalance}
                  actionType="deposit"
                  onAction={loadBalances}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Withdraw {symbol}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Your Deposits: {parseFloat(userDeposits).toFixed(4)} {symbol}
                </p>
                <AssetActions
                  assetSymbol={symbol}
                  assetName={name}
                  userBalance={userDeposits}
                  maxAmount={userDeposits}
                  actionType="withdraw"
                  onAction={loadBalances}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Borrow {symbol}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Available to Borrow: {parseFloat(liquidity).toFixed(4)} {symbol}
                </p>
                <AssetActions
                  assetSymbol={symbol}
                  assetName={name}
                  userBalance="0"
                  maxAmount={liquidity}
                  actionType="borrow"
                  onAction={loadBalances}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Repay {symbol}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Wallet Balance: {parseFloat(userBalance).toFixed(4)} {symbol}
                </p>
                <AssetActions
                  assetSymbol={symbol}
                  assetName={name}
                  userBalance={userBalance}
                  maxAmount={userBalance}
                  actionType="repay"
                  onAction={loadBalances}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 