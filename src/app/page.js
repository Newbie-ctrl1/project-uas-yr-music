'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Music, 
  Play, 
  Ticket, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  User,
  Bell,
  Wallet,
  NewspaperIcon
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Cek status login saat komponen dimount
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const features = [
    {
      icon: <Music className="w-6 h-6" />,
      title: "Streaming Musik",
      description: "Nikmati jutaan lagu dari berbagai genre musik"
    },
    {
      icon: <NewspaperIcon className="w-6 h-6" />,
      title: "Baca Berita",
      description: "Dapatkan informasi terbaru tentang musik dan event"
    },
    {
      icon: <Ticket className="w-6 h-6" />,
      title: "Beli Tiket",
      description: "Dapatkan tiket konser artis favoritmu"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Event Musik",
      description: "Buat dan promosikan event musikmu"
    }
  ]

  // Tampilan untuk user yang sudah login
  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
        {/* Welcome Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium border-2 border-white shadow-lg">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Selamat datang, {user.fullName || user.username}!</h1>
                <p className="text-gray-400">Selamat menikmati musik hari ini</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/profile?tab=notifications"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
              </Link>
              <Link 
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profil</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Wallet Balance */}
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Saldo</p>
                  <p className="text-xl font-bold">Rp {user.wallets?.[0]?.balance || '0'}</p>
                </div>
              </div>
              <Link 
                href="/profile?tab=wallet"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Lihat riwayat →
              </Link>
            </div>

            {/* Playlist Count */}
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Playlist</p>
                  <p className="text-xl font-bold">3 Playlist</p>
                </div>
              </div>
              <Link 
                href="/play"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Putar musik →
              </Link>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Lihat Event</p>
                  <p className="text-xl font-bold">Beli Tiket</p>
                </div>
              </div>
              <Link 
                href="/tiket"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Lihat tiket →
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">Aktivitas Terbaru</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium">Memutar &quot;Tulus - Hati-Hati di Jalan&quot;</p>
                    <p className="text-sm text-gray-400">2 jam yang lalu</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium">Membeli tiket &quot;NOAH Live in Concert&quot;</p>
                    <p className="text-sm text-gray-400">1 hari yang lalu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tampilan untuk user yang belum login (landing page)
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Temukan Musik & Event di YR Music
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Platform streaming musik terbaik dengan koleksi lagu terlengkap dan fitur fitur unggulan yang sudah kami sediakan untuk kamu
            </p>
            <div className="flex gap-4">
              <Link 
                href="/auth/register" 
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                Daftar Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/auth/login"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="w-full aspect-square max-w-lg mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Music className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black/30 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Fitur Unggulan
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
