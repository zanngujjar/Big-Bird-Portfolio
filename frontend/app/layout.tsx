import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Big Bird Portfolios',
  description: 'Big Bird Portfolios',
  generator: 'Big Bird Portfolios',
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
