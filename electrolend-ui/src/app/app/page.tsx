'use client'

import { useState } from 'react'
import Link from 'next/link'
import Layout from '../../components/layout/Layout'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

// Sample market data (to be replaced with real data from API)
const marketData = [
  {
    asset: 'ETN',
    depositAPY: '3.2%',
    borrowAPY: '5.8%',
    totalSupplied: '2.47M',
    totalBorrowed: '1.12M',
    liquidity: '1.35M',
    price: '$0.005',
    change: '+2.5%',
    trending: 'up',
  },
  {
    asset: 'USDC',
    depositAPY: '4.1%',
    borrowAPY: '6.3%',
    totalSupplied: '1.95M',
    totalBorrowed: '0.88M',
    liquidity: '1.07M',
    price: '$1.00',
    change: '+0.1%',
    trending: 'up',
  },
  {
    asset: 'USDT',
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

// Sample user data
const userPosition = {
  netWorth: '$1,253.47',
  supplied: {
    total: '$850.21',
    assets: [
      { asset: 'ETN', amount: '120,000', value: '$600.00', apy: '3.2%' },
      { asset: 'USDC', amount: '250.21', value: '$250.21', apy: '4.1%' },
    ],
  },
  borrowed: {
    total: '$150.00',
    assets: [
      { asset: 'USDT', amount: '150.00', value: '$150.00', apy: '6.2%' },
    ],
  },
  healthFactor: '8.5', // Healthy above 1.0
}

export default function Dashboard() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-8">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Overview of your account and market data
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
            
            {isWalletConnected ? (
              <>
                {/* User Position Overview */}
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Position</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Net Worth */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Net Worth</p>
                      <p className="text-2xl font-bold text-gray-900">{userPosition.netWorth}</p>
                    </div>
                    
                    {/* Supplied */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Supplied</p>
                      <p className="text-2xl font-bold text-gray-900">{userPosition.supplied.total}</p>
                    </div>
                    
                    {/* Borrowed */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Borrowed</p>
                      <p className="text-2xl font-bold text-gray-900">{userPosition.borrowed.total}</p>
                    </div>
                    
                    {/* Health Factor */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Health Factor</p>
                      <p className={`text-2xl font-bold ${
                        parseFloat(userPosition.healthFactor) > 2 
                          ? 'text-green-600' 
                          : parseFloat(userPosition.healthFactor) > 1 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {userPosition.healthFactor}
                      </p>
                    </div>
                  </div>
                  
                  {/* User Assets */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Supplied Assets */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">Your Supplied Assets</h3>
                      {userPosition.supplied.assets.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Asset
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Value
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  APY
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {userPosition.supplied.assets.map((asset) => (
                                <tr key={asset.asset}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {asset.asset}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {asset.amount}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {asset.value}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                    {asset.apy}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No supplied assets</p>
                      )}
                    </div>
                    
                    {/* Borrowed Assets */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">Your Borrowed Assets</h3>
                      {userPosition.borrowed.assets.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Asset
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Value
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  APY
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {userPosition.borrowed.assets.map((asset) => (
                                <tr key={asset.asset}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {asset.asset}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {asset.amount}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {asset.value}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                    {asset.apy}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No borrowed assets</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect your wallet to view your positions</h2>
                <p className="text-gray-500 mb-6">
                  Connect your wallet to see your supplied and borrowed assets
                </p>
                <button
                  onClick={() => setIsWalletConnected(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Connect Wallet
                </button>
              </div>
            )}
            
            {/* Market Overview */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Market Overview</h2>
                  <Link 
                    href="/app/markets" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View All Markets
                  </Link>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Borrowed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deposit APY
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Borrow APY
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {marketData.map((market) => (
                        <tr key={market.asset} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs">
                                {market.asset}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{market.asset}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${market.totalSupplied}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${market.totalBorrowed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            {market.depositAPY}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {market.borrowAPY}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 mr-2">{market.price}</span>
                              <span className={`text-xs ${
                                market.trending === 'up' 
                                  ? 'text-green-600' 
                                  : market.trending === 'down' 
                                    ? 'text-red-600' 
                                    : 'text-gray-500'
                              }`}>
                                {market.change}
                                {market.trending === 'up' && <ArrowTrendingUpIcon className="inline-block h-4 w-4 ml-1" />}
                                {market.trending === 'down' && <ArrowTrendingDownIcon className="inline-block h-4 w-4 ml-1" />}
                              </span>
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
      </div>
    </Layout>
  )
} 