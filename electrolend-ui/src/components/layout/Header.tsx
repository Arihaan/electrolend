'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { WalletConnect } from '../wallet/WalletConnect'
import { useWallet } from '../../context/WalletContext'

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/app' },
  { name: 'Markets', href: '/app/markets' },
  { name: 'Stake', href: '/app/stake' },
  { name: 'Governance', href: '/app/governance' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isConnected, connectWallet } = useWallet()
  
  const isAppPath = pathname.startsWith('/app')
  
  return (
    <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">ElectroLend</span>
            <div className="flex items-center">
              {/* Logo with title integrated */}
              <Image 
                src="/images/electrolend-logo.png"
                alt="ElectroLend Logo"
                width={180}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        {isAppPath && (
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold relative ${
                  pathname === item.href 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    layoutId="underline"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {isAppPath ? (
            <WalletConnect />
          ) : (
            <Link
              href="/app"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Launch App
            </Link>
          )}
        </div>
      </nav>
      
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white dark:bg-dark-surface px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-100/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">ElectroLend</span>
              <div className="flex items-center">
                {/* Logo with title integrated */}
                <Image 
                  src="/images/electrolend-logo.png"
                  alt="ElectroLend Logo"
                  width={180}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-500/20">
              <div className="space-y-2 py-6">
                {isAppPath && navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                      pathname === item.href 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {isAppPath ? (
                  <WalletConnect />
                ) : (
                  <Link
                    href="/app"
                    className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-purple-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Launch App
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
} 