'use client'

import { useState } from 'react'
import Link from 'next/link'
import Layout from '../../../components/layout/Layout'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// Sample market data (to be replaced with real data from API)
const marketData = [
  {
    asset: 'ETN',
    icon: '💎',
    full_name: 'Electroneum',
    depositAPY: '3.2%',
    borrowAPY: {
      variable: '5.8%',
      stable: '6.2%',
    },
    totalSupplied: '2.47M',
    totalBorrowed: '1.12M',
    liquidity: '1.35M',
    price: '$0.005',
    canBeCollateral: true,
    ltv: 70,
    utilizationRate: 45,
  },
  {
    asset: 'USDC',
    icon: '💵',
    full_name: 'USD Coin',
    depositAPY: '4.1%',
    borrowAPY: {
      variable: '6.3%',
      stable: '6.8%',
    },
    totalSupplied: '1.95M',
    totalBorrowed: '0.88M',
    liquidity: '1.07M',
    price: '$1.00',
    canBeCollateral: true,
    ltv: 80,
    utilizationRate: 45,
  },
  {
    asset: 'USDT',
    icon: '💲',
    full_name: 'Tether',
    depositAPY: '3.9%',
    borrowAPY: {
      variable: '6.2%',
      stable: '6.7%',
    },
    totalSupplied: '0.98M',
    totalBorrowed: '0.42M',
    liquidity: '0.56M',
    price: '$1.00',
    canBeCollateral: true,
    ltv: 80,
    utilizationRate: 43,
  },
]

export default function Markets() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  
  // Filter markets based on search term and active filter
  const filteredMarkets = marketData.filter(market => {
    const matchesSearch = market.asset.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          market.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeFilter === 'all') return matchesSearch
    if (activeFilter === 'collateral') return matchesSearch && market.canBeCollateral
    
    return matchesSearch
  })
  
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-8">
            {/* Markets Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Markets</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View all markets available on ElectroLend
                </p>
              </div>
              {!isWalletConnected && (
                <button
                  onClick={() => setIsWalletConnected(true)}
                  className="mt-4 md:mt-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-purple-700"
                >
                  Connect Wallet
                </button>
              )}
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name or symbol"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 text-sm rounded-md ${
                    activeFilter === 'all' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveFilter('all')}
                >
                  All Assets
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md ${
                    activeFilter === 'collateral' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveFilter('collateral')}
                >
                  Collateral
                </button>
              </div>
            </div>
            
            {/* Markets Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Supplied
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supply APY
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Borrowed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrow APY
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMarkets.map((market) => (
                      <tr key={market.asset} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-base">
                              {market.icon}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{market.asset}</div>
                              <div className="text-sm text-gray-500">{market.full_name}</div>
                            </div>
                            {market.canBeCollateral && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Collateral
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${market.totalSupplied}</div>
                          <div className="text-xs text-gray-500">
                            Utilization: {market.utilizationRate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600">{market.depositAPY}</div>
                          <div className="text-xs text-gray-500">
                            LTV: {market.ltv}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${market.totalBorrowed}</div>
                          <div className="text-xs text-gray-500">
                            Available: ${market.liquidity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-red-600">
                              {market.borrowAPY.variable} <span className="text-xs text-gray-500">Variable</span>
                            </div>
                            <div className="text-sm text-red-600">
                              {market.borrowAPY.stable} <span className="text-xs text-gray-500">Stable</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link 
                              href={`/app/markets/${market.asset}`} 
                              className="inline-flex items-center px-2.5 py-1.5 border border-blue-600 text-xs font-medium rounded text-blue-600 hover:bg-blue-50 focus:outline-none"
                            >
                              Details
                              <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" aria-hidden="true" />
                            </Link>
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                className="inline-flex items-center px-2.5 py-1.5 border border-blue-600 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
                              >
                                Actions
                                <ChevronDownIcon className="ml-1 h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 