"use client";

import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../components/common/Toast';

export const WalletConnect = () => {
  const { isConnected, address, balance, chainId, connecting, connectWallet, disconnectWallet } = useWallet();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Electroneum Testnet chainId
  const ELECTRONEUM_TESTNET_ID = 5201420;
  
  // Format address to display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format ETN balance
  const formatBalance = (balance: string | null) => {
    if (!balance) return '0 ETN';
    return `${(+balance).toFixed(4)} ETN`;
  };
  
  // Handle connect button click
  const handleConnect = async () => {
    if (isConnected) {
      setIsOpen(!isOpen);
    } else {
      setError(null);
      try {
        await connectWallet();
      } catch (err: any) {
        setError(err.message || 'Failed to connect wallet');
      }
    }
  };
  
  // Disconnect wallet
  const handleDisconnect = () => {
    disconnectWallet();
    setIsOpen(false);
    setError(null);
  };
  
  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      showToast('Address copied to clipboard!', 'success');
    }
  };
  
  // Check if on correct network
  const isCorrectNetwork = chainId === ELECTRONEUM_TESTNET_ID;
  
  // Button style based on connection status
  const getButtonStyle = () => {
    if (connecting) return 'bg-blue-400 text-white cursor-wait';
    if (isConnected && !isCorrectNetwork) return 'bg-yellow-500 text-white hover:bg-yellow-600';
    if (isConnected) return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800';
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };
  
  return (
    <div className="relative">
      {error && (
        <div className="absolute bottom-full mb-2 w-64 right-0 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-2 rounded-md text-xs">
          {error}
          <button 
            className="absolute top-1 right-1 text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-400" 
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${getButtonStyle()}`}
      >
        {connecting ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </div>
        ) : isConnected && address ? (
          <div className="flex items-center space-x-2">
            {!isCorrectNetwork && (
              <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1" title="Wrong Network"></span>
            )}
            <span>{formatAddress(address)}</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      
      {isConnected && isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-dark-surface ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
              <p className="font-medium">Connected Wallet</p>
              <p className="truncate font-mono text-xs mt-1">{address}</p>
              <p className="mt-1 text-xs">{formatBalance(balance)}</p>
              {!isCorrectNetwork && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚠️ Wrong Network - Please switch to Electroneum Testnet
                </p>
              )}
            </div>
            <button
              onClick={copyAddress}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              role="menuitem"
            >
              Copy Address
            </button>
            <a
              href={`https://testnet.explorer.electroneum.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              role="menuitem"
            >
              View on Explorer
            </a>
            <button
              onClick={handleDisconnect}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              role="menuitem"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 