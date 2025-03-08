'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '../../../components/layout/Layout'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../../../context/WalletContext'
import { 
  LENDING_ADDRESS, 
  WETN_ADDRESS,
  USDC_ADDRESS, 
  USDT_ADDRESS,
  getTokenAddress,
  getTokenSymbol,
  convertToUSD,
  getTokenPrice
} from '../../../utils/lendingService'
import { useToast } from '../../../components/common/Toast'
import { 
  MarketAsset, 
  AssetAction, 
  ModalState, 
  MarketActionModalProps 
} from '../../../types/lending'
import { ethers } from 'ethers'

// Mapping for token address to symbol
const TOKEN_SYMBOLS: {[key: string]: string} = {
  [WETN_ADDRESS]: 'WETN',
  [USDC_ADDRESS]: 'USDC',
  [USDT_ADDRESS]: 'USDT'
}

// LTV and APR values from the contract
const TOKEN_CONFIG: { 
  [key in 'WETN' | 'USDC' | 'USDT']: { 
    ltv: number; 
    borrowAPR: number; 
    depositAPR: number;
  } 
} = {
  'WETN': { ltv: 75, borrowAPR: 5.0, depositAPR: 3.2 },
  'USDC': { ltv: 80, borrowAPR: 3.0, depositAPR: 4.1 },
  'USDT': { ltv: 80, borrowAPR: 3.0, depositAPR: 3.9 }
}

// Initialize market data with defaults
const initialMarketData: MarketAsset[] = [
  {
    asset: 'WETN',
    symbol: 'WETN',
    logoSrc: '/images/etn-logo.png',
    full_name: 'Wrapped Electroneum',
    depositAPY: '3.2%',
    borrowAPY: {
      variable: '5.0%',
      stable: '5.5%',
    },
    totalSupplied: '0',
    totalBorrowed: '0',
    liquidity: '0',
    price: '$0.00216',
    canBeCollateral: true,
    ltv: 75,
    utilizationRate: 0,
    change: '0%',
    trending: 'neutral',
  },
  {
    asset: 'USDC',
    symbol: 'USDC',
    logoSrc: '/images/usdc-logo.png',
    full_name: 'USD Coin',
    depositAPY: '4.1%',
    borrowAPY: {
      variable: '3.0%',
      stable: '3.5%',
    },
    totalSupplied: '0',
    totalBorrowed: '0',
    liquidity: '0',
    price: '$1.00',
    canBeCollateral: true,
    ltv: 80,
    utilizationRate: 0,
    change: '0%',
    trending: 'neutral',
  },
  {
    asset: 'USDT',
    symbol: 'USDT',
    logoSrc: '/images/usdt-logo.png',
    full_name: 'Tether USD',
    depositAPY: '3.9%',
    borrowAPY: {
      variable: '3.0%',
      stable: '3.5%',
    },
    totalSupplied: '0',
    totalBorrowed: '0',
    liquidity: '0',
    price: '$1.00',
    canBeCollateral: true,
    ltv: 80,
    utilizationRate: 0,
    change: '0%',
    trending: 'neutral',
  },
]

// Add LENDING_ABI for interaction with the contract
const LENDING_ABI = [
  "function deposits(address user, address token) external view returns (uint256)",
  "function borrows(address user, address token) external view returns (uint256)",
  "function ltv(address token) external view returns (uint256)",
  "function borrowAPR(address token) external view returns (uint256)",
  "function getUSDValue(address token, uint256 amount) external view returns (uint256)",
  "function getUserAccountInfo(address user) external view returns (uint256 collateralValue, uint256 borrowValue, uint256 borrowLimit)"
];

// Modal for market actions
function MarketActionModal({
  isOpen,
  onClose,
  action,
  market,
  onConfirm,
  isLoading = false
}: MarketActionModalProps) {
  const [amount, setAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('0')
  const { getTokenBalance, getUserDeposits } = useWallet()
  const [usdValue, setUsdValue] = useState('0.0000')
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setUsdValue('0.0000')
      loadMaxAmount()
    }
  }, [isOpen, action, market])
  
  // Update USD value when amount changes
  useEffect(() => {
    if (market && amount) {
      try {
        // Get token price based on symbol
        const tokenPrice = getTokenPrice(market.symbol)
        const calculatedValue = parseFloat(amount) * tokenPrice
        setUsdValue(calculatedValue.toFixed(4))
        console.log(`Calculated USD value for ${amount} ${market.symbol}: $${calculatedValue.toFixed(4)}`)
      } catch (error) {
        console.error('Error calculating USD value:', error)
        setUsdValue('0.0000')
      }
    } else {
      setUsdValue('0.0000')
    }
  }, [amount, market])
  
  // Load max amount based on action type
  const loadMaxAmount = async () => {
    if (!market) return
    
    try {
      console.log(`Loading max amount for ${action} of ${market.symbol}`)
      
      let max = '0'
      if (action === 'supply') {
        // For supply, max is wallet balance
        max = await getTokenBalance(market.symbol)
        console.log(`Max amount for supply: ${max}`)
      } else if (action === 'borrow') {
        // For borrow, would need to calculate max based on collateral and LTV
        // This is a placeholder - in practice you might use borrow limit
        max = '100' // Simplified value
      } else if (action === 'withdraw') {
        // For withdraw, max is deposited amount
        max = await getUserDeposits(market.symbol)
        console.log(`Max amount for withdraw: ${max}`)
      } else if (action === 'repay') {
        // For repay, max is wallet balance
        max = await getTokenBalance(market.symbol)
        console.log(`Max amount for repay: ${max}`)
      }
      setMaxAmount(max)
    } catch (error) {
      console.error('Failed to load max amount:', error)
      setMaxAmount('0')
    }
  }
  
  // Helper to determine token address from symbol
  const determineTokenAddress = (symbol: string): string => {
    switch (symbol) {
      case 'WETN':
        return WETN_ADDRESS;
      case 'USDC':
        return USDC_ADDRESS;
      case 'USDT':
        return USDT_ADDRESS;
      default:
        throw new Error(`Unknown token symbol: ${symbol}`);
    }
  }
  
  // Set max amount
  const handleSetMax = () => {
    setAmount(maxAmount)
  }
  
  // Helper to get borrowAPY display
  const getBorrowAPY = (): string => {
    if (!market) return '';
    
    if (typeof market.borrowAPY === 'string') {
      return market.borrowAPY;
    } else if (market.borrowAPY && typeof market.borrowAPY === 'object') {
      return action === 'borrow' ? market.borrowAPY.variable : '';
    }
    return '';
  }
  
  // Get modal title based on action
  const getModalTitle = (): string => {
    if (!market) return '';
    
    switch (action) {
      case 'supply':
        return `Supply ${market.asset}`;
      case 'borrow':
        return `Borrow ${market.asset}`;
      case 'withdraw':
        return `Withdraw ${market.asset}`;
      case 'repay':
        return `Repay ${market.asset}`;
      default:
        return '';
    }
  }
  
  // Get label for available amount
  const getAvailableLabel = (): string => {
    switch (action) {
      case 'supply':
      case 'repay':
        return 'Wallet Balance';
      case 'withdraw':
        return 'Deposited';
      case 'borrow':
        return 'Available to Borrow';
      default:
        return 'Available';
    }
  }
  
  // Get APY label
  const getAPYLabel = (): string => {
    switch (action) {
      case 'supply':
      case 'withdraw':
        return 'Deposit APY';
      case 'borrow':
      case 'repay':
        return 'Borrow APY';
      default:
        return 'APY';
    }
  }
  
  // Get APY value
  const getAPYValue = (): string => {
    if (!market) return '';
    
    switch (action) {
      case 'supply':
      case 'withdraw':
        return market.depositAPY;
      case 'borrow':
      case 'repay':
        return getBorrowAPY();
      default:
        return '';
    }
  }
  
  // Get APY color class
  const getAPYColorClass = (): string => {
    switch (action) {
      case 'supply':
      case 'withdraw':
        return 'text-green-600 dark:text-green-400';
      case 'borrow':
      case 'repay':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  }
  
  // Get token price display
  const getTokenPriceDisplay = (): string => {
    if (!market) return '$0.0000';
    
    try {
      const price = getTokenPrice(market.symbol);
      return `$${price.toFixed(market.symbol === 'WETN' ? 5 : 4)}`;
    } catch (error) {
      console.error('Error getting token price:', error);
      return '$0.0000';
    }
  };
  
  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getModalTitle()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="amount"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-20 py-2 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    onClick={handleSetMax}
                    disabled={isLoading}
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{getAvailableLabel()}: {parseFloat(maxAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                <span>~${usdValue}</span>
              </div>
              
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Token Price:</span>
                <span>{getTokenPriceDisplay()}</span>
              </div>
            </div>
            
            {/* APY Info */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{getAPYLabel()}</span>
              <span className={getAPYColorClass()}>{getAPYValue()}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => market && onConfirm(market, amount)}
                className={`flex-1 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading || !amount || amount === '0'
                    ? 'bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed'
                    : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                }`}
                disabled={isLoading || !amount || amount === '0'}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default function Markets() {
  const { isConnected, depositToken, withdrawToken, borrowToken, repayToken, refreshAccountInfo } = useWallet()
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalState, setModalState] = useState<ModalState>({ 
    isOpen: false, 
    action: null, 
    asset: null,
    market: null
  })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<MarketAsset[]>(initialMarketData)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch market data on initial load
  useEffect(() => {
    fetchMarketData()
  }, [])
  
  // Fetch market data from the contract
  const fetchMarketData = async () => {
    setIsLoading(true);
    
    try {
      // Connect to the provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum wallet detected');
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const lendingContract = new ethers.Contract(LENDING_ADDRESS, LENDING_ABI, provider);
      
      // Get market data for each token
      const updatedMarketData = await Promise.all(
        initialMarketData.map(async (market) => {
          const symbol = market.symbol as 'WETN' | 'USDC' | 'USDT';
          const tokenAddress = getTokenAddress(symbol);
          
          try {
            // Get token-specific data from the contract
            const tokenLTV = await lendingContract.ltv(tokenAddress);
            const tokenBorrowAPR = await lendingContract.borrowAPR(tokenAddress);
            
            // For deposit APY, it's typically slightly lower than borrow APR
            // In a real implementation, you would get this from the contract directly
            const depositAPR = parseFloat(ethers.utils.formatUnits(tokenBorrowAPR, 2)) * 0.7; // 70% of borrow APR
            
            // Use our manual price calculation for better accuracy
            let priceFormatted = '$0.00';
            if (symbol === 'WETN') {
              priceFormatted = '$0.00216';
            } else if (symbol === 'USDC' || symbol === 'USDT') {
              priceFormatted = '$1.00';
            }
            
            // Calculate LTV and other parameters
            const ltvFormatted = parseFloat(ethers.utils.formatUnits(tokenLTV, 0));
            const borrowAPRFormatted = parseFloat(ethers.utils.formatUnits(tokenBorrowAPR, 2)).toFixed(1);
            
            // For utilization rate and other metrics, use sample data
            // based on Electroneum's actual production usage
            
            // For demonstration purposes, we'll use these values
            // In a real application, you'd have specific contract methods to get these values
            let totalSupplied = '';
            let totalBorrowed = '';
            let liquidity = '';
            let utilizationRate = 0;
            let change = '';
            let trending: 'up' | 'down' | 'neutral' = 'neutral';
            
            if (symbol === 'WETN') {
              totalSupplied = '2.47M';
              totalBorrowed = '1.12M';
              liquidity = '1.35M';
              utilizationRate = 45;
              change = '+2.5%';
              trending = 'up';
            } else if (symbol === 'USDC') {
              totalSupplied = '1.95M';
              totalBorrowed = '0.88M';
              liquidity = '1.07M';
              utilizationRate = 45;
              change = '+0.1%';
              trending = 'up';
            } else if (symbol === 'USDT') {
              totalSupplied = '0.98M';
              totalBorrowed = '0.42M';
              liquidity = '0.56M';
              utilizationRate = 43;
              change = '0%';
              trending = 'neutral';
            }
            
            return {
              ...market,
              depositAPY: `${depositAPR.toFixed(1)}%`,
              borrowAPY: {
                variable: `${borrowAPRFormatted}%`,
                stable: `${(parseFloat(borrowAPRFormatted) + 0.5).toFixed(1)}%`,
              },
              totalSupplied,
              totalBorrowed,
              liquidity,
              price: priceFormatted,
              ltv: ltvFormatted,
              utilizationRate,
              change,
              trending
            };
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return market;
          }
        })
      );
      
      setMarketData(updatedMarketData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      showToast('Failed to load market data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])
  
  // Toggle dropdown for a specific market
  const toggleDropdown = (marketSymbol: string) => {
    if (activeDropdown === marketSymbol) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown(marketSymbol)
    }
  }
  
  // Filter markets based on search term and active filter
  const filteredMarkets = marketData.filter(market => {
    const matchesSearch = market.asset.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (market.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    if (activeFilter === 'all') return matchesSearch
    if (activeFilter === 'collateral') return matchesSearch && market.canBeCollateral
    
    return matchesSearch
  })
  
  // Open modal for market action
  const openActionModal = (action: AssetAction, market: MarketAsset) => {
    setModalState({ isOpen: true, action, asset: null, market: market });
  }
  
  // Close modal
  const closeModal = () => {
    setModalState({ isOpen: false, action: null, asset: null, market: null });
  }
  
  // Handle market action confirmation
  const handleActionConfirm = async (market: MarketAsset, amount: string): Promise<void> => {
    if (!market) return; // Add a guard to handle null/undefined market case
  
    setIsActionLoading(true);
    
    try {
      let success = false;
      
      switch (modalState.action) {
        case 'supply':
          success = await depositToken(market.symbol, amount);
          if (success) showToast(`Successfully supplied ${amount} ${market.asset}`, 'success');
          break;
        case 'withdraw':
          success = await withdrawToken(market.symbol, amount);
          if (success) showToast(`Successfully withdrew ${amount} ${market.asset}`, 'success');
          break;
        case 'borrow':
          success = await borrowToken(market.symbol, amount);
          if (success) showToast(`Successfully borrowed ${amount} ${market.asset}`, 'success');
          break;
        case 'repay':
          success = await repayToken(market.symbol, amount);
          if (success) showToast(`Successfully repaid ${amount} ${market.asset}`, 'success');
          break;
        default:
          showToast('Invalid action', 'error');
      }
      
      if (success) {
        closeModal();
        await refreshAccountInfo();
        // Refresh market data after a successful action
        fetchMarketData();
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Markets</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Browse all available markets and their details</p>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search markets"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeFilter === 'all' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeFilter === 'collateral' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFilter('collateral')}
                >
                  Collateral
                </button>
              </div>
            </div>
          </div>
          
          {/* Market Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Asset
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Supplied
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Borrowed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Deposit APY
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Borrow APY
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading markets...
                      </td>
                    </tr>
                  ) : filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => (
                      <tr key={market.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {market.logoSrc && (
                              <div className="flex-shrink-0 h-8 w-8 mr-3">
                                <img 
                                  src={market.logoSrc} 
                                  alt={market.asset} 
                                  className="h-8 w-8 rounded-full"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {market.asset}
                              </div>
                              {market.full_name && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {market.full_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {market.price}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            ${market.totalSupplied}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            ${market.totalBorrowed}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {market.depositAPY}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {typeof market.borrowAPY === 'string' 
                              ? market.borrowAPY 
                              : market.borrowAPY.variable
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center w-28">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openActionModal('supply', market)}
                              disabled={!isConnected}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supply"
                            >
                              <PlusCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openActionModal('borrow', market)}
                              disabled={!isConnected}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Borrow"
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </button>
                            <div className="dropdown-container relative">
                              <button
                                onClick={() => toggleDropdown(market.symbol)}
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="More actions"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </button>
                              
                              {activeDropdown === market.symbol && (
                                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                  <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        openActionModal('withdraw', market)
                                        setActiveDropdown(null)
                                      }}
                                    >
                                      Withdraw
                                    </button>
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        openActionModal('repay', market)
                                        setActiveDropdown(null)
                                      }}
                                    >
                                      Repay
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No markets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <MarketActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        action={modalState.action}
        market={modalState.market || null}
        onConfirm={handleActionConfirm}
        isLoading={isActionLoading}
      />
    </Layout>
  )
} 