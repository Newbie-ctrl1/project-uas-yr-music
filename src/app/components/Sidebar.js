'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Newspaper, PlayCircle, Ticket, Calendar, Lock } from 'lucide-react'
import ProfileSidebar from './ProfileSidebar'
import { useRouter, usePathname } from 'next/navigation'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [showProfile, setShowProfile] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        setUser(JSON.parse(userData))
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Menu yang tersedia untuk semua pengguna
  const publicMenuItems = [
    {
      icon: <Newspaper className="w-5 h-5" />,
      label: "Berita Musik",
      href: "/berita"
    },
    {
      icon: <Ticket className="w-5 h-5" />,
      label: "Beli Tiket",
      href: "/tiket"
    }
  ]

  // Menu yang memerlukan login
  const privateMenuItems = [
    {
      icon: <PlayCircle className="w-5 h-5" />,
      label: "Putar Musik",
      href: "/play",
      requiresLogin: true
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Buat Event",
      href: "/event",
      requiresLogin: true
    }
  ]

  const handleRestrictedClick = (e, href) => {
    if (!user) {
      e.preventDefault()
      const confirmLogin = window.confirm('Fitur ini memerlukan login. Apakah Anda ingin login sekarang?')
      if (confirmLogin) {
        router.push('/auth/login')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="fixed left-0 top-0 h-full w-14 bg-gradient-to-b from-gray-50 to-[#f3f4] border-r border-[#000000] p-2 shadow-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-14 bg-gradient-to-b from-gray-50 to-[#f3f4] border-r border-[#000000] p-2 shadow-sm flex flex-col justify-between z-20">
        <div>
          <div className="flex justify-center mb-6">
            <Link href="/" className="p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-300">
              <Image 
                src="https://img.freepik.com/free-vector/vector-illustration-music-dark-background_206725-209.jpg?semt=ais_hybrid" 
                alt="YR Music" 
                width={32} 
                height={32} 
                priority 
              />
            </Link>
          </div>

          <nav className="space-y-2">
            {/* Public Menu Items */}
            {publicMenuItems.map((item, index) => (
              <div key={index} className="group relative">
                <Link 
                  href={item.href}
                  className={`flex justify-center p-1.5 transition-colors rounded-lg hover:bg-purple-100
                    ${pathname === item.href ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
                >
                  {item.icon}
                </Link>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-white text-gray-800 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-sm border border-gray-100">
                  {item.label}
                </div>
              </div>
            ))}

            {/* Private Menu Items */}
            {privateMenuItems.map((item, index) => (
              <div key={index} className="group relative">
                <Link 
                  href={item.href}
                  onClick={(e) => handleRestrictedClick(e, item.href)}
                  className={`flex justify-center p-1.5 transition-colors rounded-lg hover:bg-purple-100 
                    ${!user ? 'text-gray-400 cursor-not-allowed' : 
                      pathname === item.href ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
                >
                  <div className="relative">
                    {item.icon}
                    {!user && (
                      <Lock className="w-3 h-3 text-gray-400 absolute -top-1 -right-1" />
                    )}
                  </div>
                </Link>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-white text-gray-800 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-sm border border-gray-100">
                  {!user ? `${item.label} (Login Required)` : item.label}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Profile Button */}
        {user ? (
          <div className="mb-4">
            <div className="group relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-full flex justify-center p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-md">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-white text-gray-800 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-sm border border-gray-100">
                {user.fullName || user.username}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="group relative">
              <Link 
                href="/auth/login"
                className="w-full flex justify-center p-1.5 hover:bg-purple-100 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  <Lock className="w-4 h-4" />
                </div>
              </Link>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-white text-gray-800 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-sm border border-gray-100">
                Login untuk Akses Penuh
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Sidebar Component */}
      <ProfileSidebar 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </>
  )
} 