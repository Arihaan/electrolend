'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import { usePathname } from 'next/navigation'
import TestnetWarning from '../common/TestnetWarning'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const isAppPath = pathname.startsWith('/app')
  
  return (
    <div className="flex min-h-screen flex-col">
      {isAppPath && <TestnetWarning />}
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {!isAppPath && <Footer />}
    </div>
  )
} 