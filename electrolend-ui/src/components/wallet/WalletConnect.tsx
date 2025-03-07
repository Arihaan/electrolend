"use client";

import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export const WalletConnect = () => {
  const { isConnected, address, balance, connecting, connectWallet, disconnectWallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  
  // Format address to display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle connect button click
  const handleConnect = async () => {
    if (isConnected) {
      setIsOpen(!isOpen);
    } else {
      await connectWallet();
    }
  };
  
  // Disconnect wallet
  const handleDisconnect = () => {
    disconnectWallet();
    setIsOpen(false);
  };
  
  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You could add a toast notification here
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isConnected
            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
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
            <span>{formatAddress(address)}</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      
      {isConnected && isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <p className="font-medium">Connected Wallet</p>
              <p className="truncate font-mono text-xs mt-1">{address}</p>
              <p className="mt-1 text-xs">{balance ? `${(+balance).toFixed(4)} ETN` : '0 ETN'}</p>
            </div>
            <button
              onClick={copyAddress}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Copy Address
            </button>
            <button
              onClick={handleDisconnect}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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