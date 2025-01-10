import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import ClientLayout from './components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'YR Music - Temukan Musik Favoritmu',
  description: 'Platform streaming musik dan Tempat Event Kamu',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-[#1E1B4B] text-white`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
