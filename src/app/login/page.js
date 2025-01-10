'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  Music,
  Mail, 
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User
} from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting login with:', { username: formData.username })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Username atau password salah')
      }

      if (!data.token) {
        throw new Error('Token tidak ditemukan dalam respons')
      }

      // Simpan token dan data user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect ke halaman utama
      router.push('/')
      router.refresh() // Refresh untuk memperbarui state aplikasi
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo dan Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex justify-center mb-4 cursor-pointer hover:scale-110 transition-transform">
              <Music className="w-12 h-12 text-purple-500" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            Selamat Datang Kembali
          </h1>
          <p className="text-gray-400">
            Masuk ke akun YR Music Anda
          </p>
        </div>

        {/* Form Login */}
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username/Email Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username atau Email
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Masukkan username atau email"
                  required
                />
                <User className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  className="w-4 h-4 mr-2 border-gray-700 rounded focus:ring-purple-500 text-purple-500"
                />
                Ingat Saya
              </label>
              <Link
                href="/forgot-password"
                className="text-purple-500 hover:text-purple-400 transition-colors"
              >
                Lupa Password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-100/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Register Link */}
            <p className="text-center text-gray-400 text-sm">
              Belum punya akun?{' '}
              <Link href="/register" className="text-purple-500 hover:text-purple-400 transition-colors">
                Daftar di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
} 