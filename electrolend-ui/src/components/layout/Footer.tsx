'use client'

import Link from 'next/link'
import { FaTwitter, FaDiscord, FaGithub, FaMedium } from 'react-icons/fa'

const navigation = {
  protocol: [
    { name: 'About', href: '#' },
    { name: 'Docs', href: '#' },
    { name: 'Security', href: '#' },
    { name: 'Bug Bounty', href: '#' },
  ],
  governance: [
    { name: 'Voting', href: '#' },
    { name: 'Forum', href: '#' },
    { name: 'Snapshot', href: '#' },
  ],
  ecosystem: [
    { name: 'ElectroScan', href: '#' },
    { name: 'Developers', href: '#' },
    { name: 'Grants', href: '#' },
  ],
  community: [
    { name: 'Discord', href: '#' },
    { name: 'Twitter', href: '#' },
    { name: 'Blog', href: '#' },
  ],
}

const socialLinks = [
  { name: 'Twitter', href: '#', icon: FaTwitter },
  { name: 'Discord', href: '#', icon: FaDiscord },
  { name: 'GitHub', href: '#', icon: FaGithub },
  { name: 'Medium', href: '#', icon: FaMedium },
]

export default function Footer() {
  return (
    <footer className="bg-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white font-bold">
                EL
              </div>
              <span className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ElectroLend
              </span>
            </div>
            <p className="text-sm leading-6 text-gray-600">
              Decentralized, non-custodial liquidity protocol for earning interest on deposits and borrowing assets.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((item) => (
                <Link key={item.name} href={item.href} className="text-gray-500 hover:text-gray-900">
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900">Protocol</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.protocol.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900">Governance</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.governance.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900">Ecosystem</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.ecosystem.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900">Community</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.community.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-500">
            &copy; {new Date().getFullYear()} ElectroLend. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 