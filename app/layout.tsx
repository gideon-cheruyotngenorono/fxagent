import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import DashboardLayout from '@/components/layout/DashboardLayout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: 'FX AI Agent - Trading Dashboard',
  description: 'AI-driven forex trading analysis and execution agent.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-foreground bg-background`}>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  )
}
