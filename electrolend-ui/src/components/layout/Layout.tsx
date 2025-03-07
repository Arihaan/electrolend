'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const isAppPath = pathname.startsWith('/app')
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {!isAppPath && <Footer />}
    </div>
  )
} 