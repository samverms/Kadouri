import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PACE CRM - Order Management',
  description: 'QuickBooks integrated order management system',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#3b82f6' }
      }}
      afterSignOutUrl="/sign-in"
    >
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
