'use client'

import Image from 'next/image'
import Link from 'next/link'
import Layout from '../components/layout/Layout'
import { useTheme } from '../components/providers/ThemeProvider'
import { ArrowSmallRightIcon } from '@heroicons/react/24/outline'

// Hero section stats
const stats = [
  { name: 'Total Value Locked', value: '$0.2M+' },
  { name: 'Supported Tokens', value: '3' },
  { name: 'Total Users', value: '2+' },
  { name: 'Interest Rate', value: 'Variable' },
]

// Features
const features = [
  {
    name: 'Variable Interest Rates',
    description:
      'Our dynamic interest rate model adapts to market conditions, ensuring competitive rates for both lenders and borrowers.',
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      </div>
    ),
  },
  {
    name: 'Security First',
    description:
      'Our protocol undergoes rigorous security audits and employs robust risk management practices to protect your assets.',
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      </div>
    ),
  },
  {
    name: 'Liquidity Pools',
    description:
      'Deposit assets into liquidity pools to earn interest, or borrow assets by providing collateral, all in a decentralized way.',
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
        </svg>
      </div>
    ),
  },
  {
    name: 'Non-Custodial',
    description:
      'Maintain full control of your assets at all times. Your keys, your crypto - no third-party custody.',
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
    ),
  },
]

// Top performing assets
const topAssets = [
  {
    symbol: 'ETN',
    name: 'Electroneum',
    logoSrc: '/images/etn-logo.png',
    price: '$0.00216',
    change: '+2.5%',
    supplyAPY: '3.2%',
    borrowAPY: '5.8%',
    color: 'from-blue-500 to-blue-600',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logoSrc: '/images/usdc-logo.png',
    price: '$0.99',
    change: '+0.1%',
    supplyAPY: '4.1%',
    borrowAPY: '6.3%',
    color: 'from-green-500 to-green-600',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    logoSrc: '/images/usdt-logo.png',
    price: '$1.00',
    change: '0%',
    supplyAPY: '3.9%',
    borrowAPY: '6.2%',
    color: 'from-teal-500 to-teal-600',
  },
]

export default function Home() {
  const { theme } = useTheme();
  
  return (
    <Layout>
      {/* Hero section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 dark:from-dark-blue-900/20 dark:to-dark-bg">
        <div className="absolute inset-x-0 top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:top-80" aria-hidden="true">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl pt-10 pb-16 sm:pb-16">
          <div className="px-6 lg:px-8 lg:grid lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-7 lg:pr-8 flex flex-col justify-center">
              <div className="max-w-2xl">
                <div>
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/50 px-2.5 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-300/20">
                    Now on Electroneum Testnet
                  </span>
                </div>
                <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Borrow and Lend on{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Electroneum
                  </span>
                </h1>
                <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-lg">
                  ElectroLend is the first decentralized, non-custodial liquidity protocol where users can participate as depositors or borrowers on the Electroneum network.
                </p>
                <div className="mt-8 flex items-center gap-x-4">
                  <Link
                    href="/app"
                    className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Launch App
                  </Link>
                  <Link href="https://x.com/intent/user?screen_name=electrolend" className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300 flex items-center">
                    Follow us on 𝕏 for updates<ArrowSmallRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 mt-12 lg:mt-0">
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-blue-800 to-indigo-900' : 'from-blue-600 to-purple-700'} p-6 text-white`}>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Top Markets</h2>
                    <p className="text-sm text-blue-100">Deposit or borrow these assets</p>
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    {/* Asset Cards */}
                    {topAssets.map((asset) => (
                      <div key={asset.symbol} className="rounded-lg bg-white/10 p-4 backdrop-blur-sm hover:bg-white/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden`}>
                              <Image
                                src={asset.logoSrc}
                                alt={`${asset.name} logo`}
                                width={28}
                                height={28}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{asset.name}</h3>
                              <p className="text-xs text-blue-200">Supply APY: {asset.supplyAPY}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{asset.price}</p>
                            <p className="text-xs text-green-300">Borrow APY: {asset.borrowAPY}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Quick Action Button */}
                    <Link 
                      href="/app/markets"
                      className="rounded-lg bg-white/5 hover:bg-white/15 p-3 text-center font-medium backdrop-blur-sm border border-white/10 transition-colors"
                    >
                      View All Markets →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white dark:from-dark-bg sm:h-32" />
      </div>

      {/* Stats Section */}
      <div className="border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-12 text-center lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="mx-auto flex max-w-xs flex-col gap-y-2">
                <dt className="text-base leading-7 text-gray-600 dark:text-gray-400">{stat.name}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Feature section */}
      <div id="features" className="bg-white dark:bg-dark-bg py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">Powerful Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to lend and borrow assets
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              ElectroLend provides a secure, transparent and efficient platform for cryptocurrency lending and borrowing on Electroneum.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0">{feature.icon}</div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:flex lg:items-center lg:justify-between lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
            <br />
            Launch ElectroLend.
          </h2>
          <div className="mt-8 flex items-center gap-x-6 lg:mt-0 lg:flex-shrink-0">
            <Link
              href="/app"
              className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Launch App
            </Link>
            <a 
              href="https://x.com/intent/user?screen_name=electrolend" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center text-sm font-semibold leading-6 text-white hover:text-blue-100 transition-colors"
            >
              <svg 
                viewBox="0 0 24 24" 
                aria-hidden="true" 
                className="h-5 w-5 mr-2 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              Follow us on X
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
} 