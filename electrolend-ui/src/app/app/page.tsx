'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../components/layout/Layout'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../../context/WalletContext'
import { 
  getTokenAddress, 
  WETN_ADDRESS, 
  USDC_ADDRESS, 
  USDT_ADDRESS, 
  LENDING_ADDRESS,
  convertToUSD,
  getTokenPrice
} from '../../utils/lendingService'
import { useToast } from '../../components/common/Toast'
import { 
  MarketAsset, 
  UserAsset, 
  UserPosition, 
  AssetAction, 
  ModalState, 
  AssetActionModalProps 
} from '../../types/lending'
import { ethers } from 'ethers'

// LENDING_ABI for contract interactions
const LENDING_ABI = [
  "function deposits(address user, address token) external view returns (uint256)",
  "function borrows(address user, address token) external view returns (uint256)",
  "function calculateBorrowWithInterest(address user, address token) external view returns (uint256)",
  "function getUSDValue(address token, uint256 amount) external view returns (uint256)",
  "function getUserAccountInfo(address user) external view returns (uint256 collateralValue, uint256 borrowValue, uint256 borrowLimit)"
];

// Token mapping with proper type signature
interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

const TOKEN_SYMBOLS: { [address: string]: TokenInfo } = {
  [WETN_ADDRESS]: { symbol: 'WETN', name: 'Wrapped Electroneum', decimals: 18 },
  [USDC_ADDRESS]: { symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  [USDT_ADDRESS]: { symbol: 'USDT', name: 'Tether USD', decimals: 18 }
};

// Sample market data - update ETN references to WETN
const marketData: MarketAsset[] = [
  {
    asset: 'WETN',
    symbol: 'WETN',
    logoSrc: '/images/etn-logo.png',
    depositAPY: '3.2%',
    borrowAPY: '5.8%',
    totalSupplied: '2.47M',
    totalBorrowed: '1.12M',
    liquidity: '1.35M',
    price: '$0.00216',
    change: '+2.5%',
    trending: 'up',
  },
  {
    asset: 'USDC',
    symbol: 'USDC',
    logoSrc: '/images/usdc-logo.png',
    depositAPY: '4.1%',
    borrowAPY: '6.3%',
    totalSupplied: '1.95M',
    totalBorrowed: '0.88M',
    liquidity: '1.07M',
    price: '$0.99',
    change: '+0.1%',
    trending: 'up',
  },
  {
    asset: 'USDT',
    symbol: 'USDT',
    logoSrc: '/images/usdt-logo.png',
    depositAPY: '3.9%',
    borrowAPY: '6.2%',
    totalSupplied: '0.98M',
    totalBorrowed: '0.42M',
    liquidity: '0.56M',
    price: '$1.00',
    change: '0%',
    trending: 'neutral',
  },
]

// Initialize empty user position
const emptyUserPosition: UserPosition = {
  netWorth: '$0.00',
  supplied: {
    total: '$0.00',
    assets: [],
  },
  borrowed: {
    total: '$0.00',
    assets: [],
  },
  healthFactor: '0.0',
}

// Modal for supply/borrow actions
function AssetActionModal({
  isOpen,
  onClose,
  action,
  asset,
  onConfirm,
  isLoading = false
}: AssetActionModalProps) {
  const [amount, setAmount] = useState('')
  const { getTokenBalance, getUserDeposits } = useWallet()
  const [maxAmount, setMaxAmount] = useState('')
  const [usdValue, setUsdValue] = useState('0.0000')
  
  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setUsdValue('0.0000')
      loadMaxAmount()
    }
  }, [isOpen, asset, action])
  
  // Update USD value when amount changes
  useEffect(() => {
    if (asset && amount) {
      try {
        // Get token price based on symbol
        const tokenPrice = getTokenPrice(asset.symbol);
        const calculatedValue = parseFloat(amount) * tokenPrice;
        setUsdValue(calculatedValue.toFixed(4));
      } catch (error) {
        console.error('Error calculating USD value:', error);
        setUsdValue('0.0000');
      }
    } else {
      setUsdValue('0.0000');
    }
  }, [amount, asset]);
  
  // Load max amount for the action
  const loadMaxAmount = async () => {
    if (!asset || !action) return;
    
    try {
      console.log(`Loading max amount for ${action} of ${asset.symbol}`);
      
      if (action === 'supply') {
        // For supply, max is wallet balance
        const balance = await getTokenBalance(asset.symbol)
        console.log(`Max balance for supply: ${balance}`);
        setMaxAmount(balance)
      } else if (action === 'withdraw') {
        // For withdraw, max is deposited amount
        const deposited = await getUserDeposits(asset.symbol)
        console.log(`Max balance for withdraw: ${deposited}`);
        setMaxAmount(deposited)
      } else if (action === 'borrow') {
        // For borrow, this would be a more complex calculation
        // For now, we'll use a placeholder
        setMaxAmount('1000')
      } else if (action === 'repay') {
        // For repay, max is either borrowed amount or wallet balance (whichever is less)
        const balance = await getTokenBalance(asset.symbol)
        console.log(`Max balance for repay: ${balance}`);
        // In a real app, we'd get the borrowed amount from the contract
        setMaxAmount(balance)
      }
    } catch (error) {
      console.error('Error loading max amount:', error)
      setMaxAmount('0')
    }
  }
  
  // Function to determine token address from symbol
  const determineTokenAddress = (symbol: string): string => {
    switch (symbol.toUpperCase()) {
      case 'WETN': return WETN_ADDRESS;
      case 'USDC': return USDC_ADDRESS;
      case 'USDT': return USDT_ADDRESS;
      default: throw new Error(`Unsupported token: ${symbol}`);
    }
  }
  
  // Handle max button click
  const handleSetMax = () => {
    setAmount(maxAmount)
  }
  
  // Helper function to get deposit APY with type guard
  const getDepositAPY = (): string => {
    if (!asset) return '0%';
    
    // Check if the asset is a MarketAsset by looking for depositAPY property
    if ('depositAPY' in asset) {
      return asset.depositAPY;
    }
    
    // For UserAsset, return the apy property
    return asset.apy;
  }
  
  // Helper function to get borrow APY with type guard
  const getBorrowAPY = (): string => {
    if (!asset) return '0%';
    
    // Check if the asset is a MarketAsset
    if ('borrowAPY' in asset) {
      // Handle both string and object types for borrowAPY
      return typeof asset.borrowAPY === 'string' 
        ? asset.borrowAPY 
        : asset.borrowAPY.variable;
    }
    
    // For UserAsset, return a default or get from somewhere else
    return asset.apy; // Using the same APY but in a real app might be different
  }
  
  // Get token price
  const getTokenPriceDisplay = (): string => {
    if (!asset) return '$0.0000';
    
    try {
      const price = getTokenPrice(asset.symbol);
      return `$${price.toFixed(asset.symbol === 'WETN' ? 5 : 4)}`;
    } catch (error) {
      console.error('Error getting token price:', error);
      return '$0.0000';
    }
  }
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {action === 'supply' 
                ? 'Supply' 
                : action === 'withdraw' 
                  ? 'Withdraw' 
                  : action === 'borrow' 
                    ? 'Borrow' 
                    : 'Repay'} {asset?.symbol}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="0.00"
                  disabled={isLoading}
                />
                <button 
                  className="absolute right-2 top-2 text-sm text-blue-600 dark:text-blue-400 font-medium"
                  onClick={handleSetMax}
                  disabled={isLoading}
                >
                  MAX
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Available: {parseFloat(maxAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                <span>~${usdValue}</span>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Token Price:</span>
                <span>{getTokenPriceDisplay()}</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{action === 'supply' || action === 'withdraw' ? 'Deposit' : 'Borrow'} APY:</span>
              <span className={action === 'supply' || action === 'withdraw' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {action === 'supply' || action === 'withdraw' 
                  ? getDepositAPY()
                  : getBorrowAPY()
                }
              </span>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (asset) onConfirm(asset, amount);
                }}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!amount || amount === '0' || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </div>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { isConnected, depositToken, withdrawToken, borrowToken, repayToken, refreshAccountInfo, accountInfo, address } = useWallet()
  const { showToast } = useToast()
  const [modalState, setModalState] = useState<ModalState>({ 
    isOpen: false, 
    action: null, 
    asset: null,
    market: null 
  })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [userPositions, setUserPositions] = useState<UserPosition>(emptyUserPosition)
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch user positions from the contract
  const fetchUserPositions = async () => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    
    try {
      // Connect to provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum wallet detected');
      }
      
      console.log("Fetching user positions for:", address);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const lendingContract = new ethers.Contract(
        LENDING_ADDRESS,
        LENDING_ABI,
        provider
      );
      
      // Get user account info (collateral value, borrow value, borrow limit)
      const accountInfo = await lendingContract.getUserAccountInfo(address);
      console.log("Raw account info from contract:", {
        collateralValue: accountInfo.collateralValue.toString(),
        borrowValue: accountInfo.borrowValue.toString(),
        borrowLimit: accountInfo.borrowLimit.toString()
      });
      
      const collateralValueUSD = ethers.utils.formatUnits(accountInfo.collateralValue, 8);
      const borrowValueUSD = ethers.utils.formatUnits(accountInfo.borrowValue, 8);
      const borrowLimitUSD = ethers.utils.formatUnits(accountInfo.borrowLimit, 8);
      
      console.log("Formatted account info:", {
        collateralValueUSD,
        borrowValueUSD,
        borrowLimitUSD
      });
      
      // Calculate health factor
      const healthFactor = parseFloat(borrowValueUSD) > 0 
        ? (parseFloat(collateralValueUSD) / parseFloat(borrowValueUSD)).toFixed(2)
        : '∞'; // Infinity symbol if no borrows
      
      // Get supplied and borrowed assets
      const suppliedAssets: UserAsset[] = [];
      const borrowedAssets: UserAsset[] = [];
      
      // Check each token
      const tokenAddresses = [WETN_ADDRESS, USDC_ADDRESS, USDT_ADDRESS];
      let totalSuppliedValue = 0;
      let totalBorrowedValue = 0;
      
      console.log("Checking token balances...");
      
      for (const tokenAddress of tokenAddresses) {
        const tokenInfo = TOKEN_SYMBOLS[tokenAddress];
        if (!tokenInfo) {
          console.log("Token info not found for", tokenAddress);
          continue;
        }
        
        console.log(`Processing token: ${tokenInfo.symbol}`);
        
        try {
          // Get deposits
          const depositAmount = await lendingContract.deposits(address, tokenAddress);
          console.log(`${tokenInfo.symbol} deposit amount:`, depositAmount.toString());
          
          if (depositAmount.gt(0)) {
            const formattedAmount = ethers.utils.formatUnits(depositAmount, tokenInfo.decimals);
            console.log(`${tokenInfo.symbol} formatted amount:`, formattedAmount);
            
            // Use the token price from our constants
            const tokenPrice = getTokenPrice(tokenInfo.symbol);
            console.log(`${tokenInfo.symbol} price:`, tokenPrice);
            
            const usdValue = parseFloat(formattedAmount) * tokenPrice;
            console.log(`${tokenInfo.symbol} USD value:`, usdValue);
            
            totalSuppliedValue += usdValue;
            
            // Round amount and value to 4 decimal places
            const roundedAmount = parseFloat(formattedAmount).toFixed(4);
            
            suppliedAssets.push({
              asset: tokenInfo.name,
              symbol: tokenInfo.symbol,
              amount: roundedAmount,
              value: `$${usdValue.toFixed(4)}`,
              apy: tokenInfo.symbol === 'WETN' ? '3.2%' : tokenInfo.symbol === 'USDC' ? '4.1%' : '3.9%'
            });
          }
          
          // Get borrows with interest
          const borrowAmount = await lendingContract.calculateBorrowWithInterest(address, tokenAddress);
          console.log(`${tokenInfo.symbol} borrow amount:`, borrowAmount.toString());
          
          if (borrowAmount.gt(0)) {
            const formattedAmount = ethers.utils.formatUnits(borrowAmount, tokenInfo.decimals);
            console.log(`${tokenInfo.symbol} formatted borrow amount:`, formattedAmount);
            
            // Use the token price from our constants
            const tokenPrice = getTokenPrice(tokenInfo.symbol);
            const usdValue = parseFloat(formattedAmount) * tokenPrice;
            console.log(`${tokenInfo.symbol} borrow USD value:`, usdValue);
            
            totalBorrowedValue += usdValue;
            
            // Round amount and value to 4 decimal places
            const roundedAmount = parseFloat(formattedAmount).toFixed(4);
            
            borrowedAssets.push({
              asset: tokenInfo.name,
              symbol: tokenInfo.symbol,
              amount: roundedAmount,
              value: `$${usdValue.toFixed(4)}`,
              apy: tokenInfo.symbol === 'WETN' ? '5.0%' : tokenInfo.symbol === 'USDC' ? '3.0%' : '3.0%'
            });
          }
        } catch (error) {
          console.error(`Error processing ${tokenInfo.symbol}:`, error);
        }
      }
      
      console.log("Total supplied value:", totalSuppliedValue);
      console.log("Total borrowed value:", totalBorrowedValue);
      console.log("Supplied assets:", suppliedAssets);
      console.log("Borrowed assets:", borrowedAssets);
      
      // Calculate net worth (total supplied minus total borrowed)
      const netWorth = Math.max(0, totalSuppliedValue - totalBorrowedValue);
      
      // Update user position state
      const newPosition: UserPosition = {
        netWorth: `$${netWorth.toFixed(2)}`,
        supplied: {
          total: `$${totalSuppliedValue.toFixed(2)}`,
          assets: suppliedAssets,
        },
        borrowed: {
          total: `$${totalBorrowedValue.toFixed(2)}`,
          assets: borrowedAssets,
        },
        healthFactor,
      };
      
      console.log("Final position data:", newPosition);
      
      setUserPositions(newPosition);
    } catch (error) {
      console.error('Error fetching user positions:', error);
      showToast('Failed to load your positions', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to check token balances directly - for debugging
  const checkTokenBalances = async () => {
    if (!address) return;
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    for (const tokenAddress of [WETN_ADDRESS, USDC_ADDRESS, USDT_ADDRESS]) {
      try {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)",
            "function symbol() external view returns (string)"
          ],
          provider
        );
        
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(address);
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        
        console.log(`Token ${symbol} balance for ${address}: ${formattedBalance}`);
      } catch (error) {
        console.error(`Error checking balance for ${tokenAddress}:`, error);
      }
    }
  };
  
  // Update dashboard to also check balances when it loads
  useEffect(() => {
    if (isConnected && address) {
      fetchUserPositions();
      // Also check token balances directly for debugging
      checkTokenBalances();
    }
  }, [isConnected, address, accountInfo]);
  
  const openModal = (action: AssetAction, asset: MarketAsset | UserAsset) => {
    setModalState({ isOpen: true, action, asset, market: null });
  };
  
  const closeModal = () => {
    setModalState({ isOpen: false, action: null, asset: null, market: null });
  };
  
  // Handle the confirm action from the modal
  const handleActionConfirm = async (asset: MarketAsset | UserAsset, amount: string): Promise<void> => {
    setIsActionLoading(true);
    
    try {
      let success = false;
      
      // Perform the action based on the current modal state
      switch (modalState.action) {
        case 'supply':
          success = await depositToken(asset.symbol, amount);
          break;
          
        case 'withdraw':
          success = await withdrawToken(asset.symbol, amount);
          break;
          
        case 'borrow':
          success = await borrowToken(asset.symbol, amount);
          break;
          
        case 'repay':
          success = await repayToken(asset.symbol, amount);
          break;
          
        default:
          showToast('Invalid action', 'error');
          success = false;
      }
      
      // Handle the result
      if (success) {
        closeModal();
        await refreshAccountInfo();
        // Refresh user positions
        fetchUserPositions();
      }
    } catch (error) {
      console.error('Error performing action:', error);
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-dark-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Overview of your account and position
                </p>
              </div>
              
              {isConnected && (
                <Link 
                  href="/app/markets" 
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  View Markets
                </Link>
              )}
            </div>
            
            {isConnected ? (
              <>
                {/* User Position Overview */}
                <div className="bg-white dark:bg-dark-surface shadow-sm rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Position</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Net Worth */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Net Worth</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {accountInfo?.collateralValue 
                          ? `$${parseFloat(accountInfo.collateralValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : userPositions.netWorth}
                      </p>
                    </div>
                    
                    {/* Supplied */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Supplied</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {accountInfo?.collateralValue 
                          ? `$${parseFloat(accountInfo.collateralValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : userPositions.supplied.total}
                      </p>
                    </div>
                    
                    {/* Borrowed */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Borrowed</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {accountInfo?.borrowValue 
                          ? `$${parseFloat(accountInfo.borrowValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : userPositions.borrowed.total}
                      </p>
                    </div>
                    
                    {/* Health Factor */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Health Factor</p>
                      <p className={`text-2xl font-bold ${
                        parseFloat(accountInfo?.healthFactor || userPositions.healthFactor) > 2 
                          ? 'text-green-600 dark:text-green-400' 
                          : parseFloat(accountInfo?.healthFactor || userPositions.healthFactor) > 1 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {accountInfo?.healthFactor || userPositions.healthFactor}
                      </p>
                    </div>
                  </div>
                  
                  {/* User Assets */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Supplied Assets */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Your Supplied Assets</h3>
                      {userPositions.supplied.assets.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Asset
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Value
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  APY
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {userPositions.supplied.assets.map((asset) => {
                                const marketAsset = marketData.find(m => m.symbol === asset.symbol);
                                return (
                                  <tr key={asset.asset}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                      {asset.asset}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {asset.amount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {asset.value}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                      {asset.apy}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium w-16">
                                      <div className="flex justify-end">
                                        <button
                                          onClick={() => openModal('withdraw', asset)}
                                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                          title="Withdraw"
                                        >
                                          <MinusCircleIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No supplied assets</p>
                      )}
                    </div>
                    
                    {/* Borrowed Assets */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Your Borrowed Assets</h3>
                      {userPositions.borrowed.assets.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Asset
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Value
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  APY
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {userPositions.borrowed.assets.map((asset) => {
                                const marketAsset = marketData.find(m => m.symbol === asset.symbol);
                                return (
                                  <tr key={asset.asset}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                      {asset.asset}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {asset.amount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {asset.value}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                      {asset.apy}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium w-16">
                                      <div className="flex justify-end">
                                        <button
                                          onClick={() => openModal('repay', asset)}
                                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                          title="Repay"
                                        >
                                          <PlusCircleIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No borrowed assets</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-dark-surface shadow-sm rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect your wallet to view your positions</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Connect your wallet to see your supplied and borrowed assets
                </p>
                
                <Link
                  href="/app/markets"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  View Markets
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AssetActionModal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        action={modalState.action}
        asset={modalState.asset}
        onConfirm={handleActionConfirm}
        isLoading={isActionLoading}
      />
    </Layout>
  )
} 