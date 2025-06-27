import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { PortfolioProvider } from '@/lib/portfolios'

export const metadata: Metadata = {
  title: 'Big Bird Portfolios',
  description: 'Big Bird Portfolios',
  generator: 'Big Bird Portfolios',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/android-chrome-192x192.png',
  },
  openGraph: {
    title: 'Big Bird Portfolios',
    description: 'Big Bird Portfolios',
    url: 'https://bigbirdportfolios.com', // Replace with your actual domain
    siteName: 'Big Bird Portfolios',
    images: [
      {
        url: 'https://big-bird-portfolio-frontend.onrender.com/og-image.png',
        width: 512,
        height: 512,
        alt: 'Big Bird Portfolios',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Big Bird Portfolios',
    description: 'Big Bird Portfolios',
    images: ['https://big-bird-portfolio-frontend.onrender.com/og-image.png'],
  },
  appleWebApp: {
    title: 'Big Bird Portfolios',
    statusBarStyle: 'default',
    capable: true,
  },
  other: {
    'apple-mobile-web-app-title': 'Big Bird Portfolios',
    'application-name': 'Big Bird Portfolios',
    'msapplication-TileColor': '#ffffff',
    'theme-color': '#ffffff',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PortfolioProvider>
            {children}
          </PortfolioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
