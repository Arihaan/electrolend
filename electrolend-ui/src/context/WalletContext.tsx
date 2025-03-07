"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import * as web3 from '../utils/web3';

// Define context types
type WalletContextType = {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  depositToken: (tokenAddress: string, amount: string) => Promise<any>;
  withdrawToken: (tokenAddress: string, amount: string) => Promise<any>;
  borrowToken: (tokenAddress: string, amount: string) => Promise<any>;
  repayToken: (tokenAddress: string, amount: string) => Promise<any>;
  getTokenBalance: (tokenAddress: string) => Promise<string>;
  getUserDeposits: (tokenAddress: string) => Promise<string>;
  accountInfo: {
    collateralValue: string;
    borrowValue: string;
    borrowLimit: string;
    healthFactor: string;
  } | null;
  refreshAccountInfo: () => Promise<void>;
};

// Default context values
const defaultContext: WalletContextType = {
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  depositToken: async () => ({}),
  withdrawToken: async () => ({}),
  borrowToken: async () => ({}),
  repayToken: async () => ({}),
  getTokenBalance: async () => '0',
  getUserDeposits: async () => '0',
  accountInfo: null,
  refreshAccountInfo: async () => {},
};

// Create context
const WalletContext = createContext<WalletContextType>(defaultContext);

// Provider props
type WalletProviderProps = {
  children: ReactNode;
};

// Hook for easy context use
export const useWallet = () => useContext(WalletContext);

// Provider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [accountInfo, setAccountInfo] = useState<WalletContextType['accountInfo']>(null);

  // Initialize wallet from local storage on component mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if previously connected
      const savedAddress = localStorage.getItem('walletAddress');
      if (savedAddress) {
        try {
          await connectWallet();
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          localStorage.removeItem('walletAddress');
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (accounts[0] !== address) {
        // Account changed
        setAddress(accounts[0]);
        updateBalance(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address]);

  // Update ether balance
  const updateBalance = async (address: string) => {
    if (!address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balanceWei));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (connecting) return;
    
    setConnecting(true);
    
    try {
      const { provider, signer } = await web3.initializeWeb3();
      
      // Get account
      const accounts = await provider.listAccounts();
      const currentAddress = accounts[0];
      
      // Get chain ID
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      
      // Save address
      setAddress(currentAddress);
      localStorage.setItem('walletAddress', currentAddress);
      
      // Get balance
      await updateBalance(currentAddress);
      
      // Get account info
      await refreshAccountInfo();
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setAccountInfo(null);
    localStorage.removeItem('walletAddress');
  };

  // Refresh account info
  const refreshAccountInfo = async () => {
    try {
      if (!isConnected && !address) return;
      
      const info = await web3.getUserAccountInfo();
      setAccountInfo(info);
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  // Context value
  const value: WalletContextType = {
    isConnected,
    address,
    balance,
    chainId,
    connecting,
    connectWallet,
    disconnectWallet,
    depositToken: web3.depositToken,
    withdrawToken: web3.withdrawToken,
    borrowToken: web3.borrowToken,
    repayToken: web3.repayToken,
    getTokenBalance: web3.getTokenBalance,
    getUserDeposits: web3.getUserDeposits,
    accountInfo,
    refreshAccountInfo,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 