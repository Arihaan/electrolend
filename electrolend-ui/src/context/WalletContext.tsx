"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { 
  depositToken, 
  withdrawToken, 
  borrowToken, 
  repayToken, 
  getTokenBalance, 
  getDepositedAmount,
  getUserAccountInfo,
  getTokenAddress,
  getTokenSymbol,
  ETN_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS
} from '../utils/lendingService';
import { initializeWeb3 } from '../utils/web3';
import { useToast } from '../components/common/Toast';

// Define context types
type WalletContextType = {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  depositToken: (tokenSymbol: string, amount: string) => Promise<any>;
  withdrawToken: (tokenSymbol: string, amount: string) => Promise<any>;
  borrowToken: (tokenSymbol: string, amount: string) => Promise<any>;
  repayToken: (tokenSymbol: string, amount: string) => Promise<any>;
  getTokenBalance: (tokenSymbol: string) => Promise<string>;
  getUserDeposits: (tokenSymbol: string) => Promise<string>;
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
  depositToken: async () => false,
  withdrawToken: async () => false,
  borrowToken: async () => false,
  repayToken: async () => false,
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
  const { showToast } = useToast();
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
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      // Check if we're on Electroneum Testnet (chain ID 5201420)
      if (newChainId === 5201420) {
        // Show toast for connected to Electroneum Testnet
      } else {
        // Show toast for please switch to Electroneum Testnet
      }
      
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
      // Check if MetaMask or another wallet is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        // Show toast for no Ethereum wallet detected
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another wallet.');
      }
      
      // Initialize web3 connection
      const web3Info = await initializeWeb3();
      const provider = web3Info.provider;
      const signer = web3Info.signer;
      
      // Get account
      const accounts = await provider.listAccounts();
      if (!accounts || accounts.length === 0) {
        // Show toast for no accounts found
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }
      
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
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      // Reset state on error
      disconnectWallet();
      
      // Show error to user
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
      
      const info = await getUserAccountInfo();
      setAccountInfo(info);
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  // Helper function to get token address from symbol or address
  const getTokenAddressHelper = (tokenSymbolOrAddress: string): string => {
    // Check if the input is already an address
    if (tokenSymbolOrAddress.startsWith('0x') && tokenSymbolOrAddress.length > 10) {
      // It's an address, use it directly
      return tokenSymbolOrAddress;
    } else {
      // It's a symbol, convert to address
      return getTokenAddress(tokenSymbolOrAddress);
    }
  };

  const handleDepositToken = async (tokenSymbol: string, amount: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await depositToken(tokenAddress, amount);
  };

  const handleWithdrawToken = async (tokenSymbol: string, amount: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await withdrawToken(tokenAddress, amount);
  };

  const handleBorrowToken = async (tokenSymbol: string, amount: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await borrowToken(tokenAddress, amount);
  };

  const handleRepayToken = async (tokenSymbol: string, amount: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await repayToken(tokenAddress, amount);
  };

  const handleGetTokenBalance = async (tokenSymbol: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await getTokenBalance(tokenAddress);
  };

  const handleGetUserDeposits = async (tokenSymbol: string) => {
    const tokenAddress = getTokenAddressHelper(tokenSymbol);
    return await getDepositedAmount(tokenAddress);
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
    depositToken: handleDepositToken,
    withdrawToken: handleWithdrawToken,
    borrowToken: handleBorrowToken,
    repayToken: handleRepayToken,
    getTokenBalance: handleGetTokenBalance,
    getUserDeposits: handleGetUserDeposits,
    accountInfo,
    refreshAccountInfo,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 