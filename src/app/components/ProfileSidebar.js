'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut, BarChart2, Wallet } from 'lucide-react'

export default function ProfileSidebar({ isOpen, onClose, user }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Hapus data user dari localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Tutup sidebar
      onClose()

      // Redirect ke halaman login
      router.push('/auth/login')
      router.refresh()

      // Reload halaman untuk memastikan state ter-reset
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!user) return null

  return (
    <>
      {/* Profile Tab */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 transform z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium border-2 border-white shadow-lg">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold">{user.fullName || user.username}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-purple-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <Link href="/profile" className="flex items-center gap-3 p-3 hover:bg-purple-100 rounded-lg text-gray-700 hover:text-purple-600 transition-colors">
              <User className="w-5 h-5 text-purple-500" />
              <span>Profil</span>
            </Link>
            <Link href="/profile?tab=wallet" className="flex items-center gap-3 p-3 hover:bg-purple-100 rounded-lg text-gray-700 hover:text-purple-600 transition-colors">
              <Wallet className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <span>Dompet</span>
                <p className="text-sm text-gray-500">Rp {user.wallets?.[0]?.balance || '0'}</p>
              </div>
            </Link>
            <Link href="/perdagangan" className="flex items-center gap-3 p-3 hover:bg-purple-100 rounded-lg text-gray-700 hover:text-purple-600 transition-colors">
              <BarChart2 className="w-5 h-5 text-purple-500" />
              <span>Perdagangan</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 hover:bg-red-100 rounded-lg text-red-500 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-20"
          onClick={onClose}
        />
      )}
    </>
  )
} 