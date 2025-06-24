import type { Metadata } from 'next'
import './globals.css'

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
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Big Bird Portfolios',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Big Bird Portfolios',
    description: 'Big Bird Portfolios',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
