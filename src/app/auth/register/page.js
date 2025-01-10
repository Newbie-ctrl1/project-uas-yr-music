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
  User,
  UserPlus,
  AlertCircle
} from 'lucide-react'

// Fungsi validasi
const validateForm = (formData) => {
  const errors = {}

  // Validasi username
  if (!formData.username) {
    errors.username = 'Username wajib diisi'
  } else if (formData.username.length < 3) {
    errors.username = 'Username minimal 3 karakter'
  } else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
    errors.username = 'Username hanya boleh mengandung huruf, angka, underscore, dan titik'
  }

  // Validasi email
  if (!formData.email) {
    errors.email = 'Email wajib diisi'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Format email tidak valid'
  }

  // Validasi password dengan pengecekan terpisah
  if (!formData.password) {
    errors.password = 'Password wajib diisi'
  } else {
    const hasLetter = /[a-zA-Z]/.test(formData.password)
    const hasNumber = /\d/.test(formData.password)
    const isLongEnough = formData.password.length >= 6

    if (!isLongEnough) {
      errors.password = 'Password minimal 6 karakter'
    } else if (!hasLetter) {
      errors.password = 'Password harus mengandung minimal 1 huruf'
    } else if (!hasNumber) {
      errors.password = 'Password harus mengandung minimal 1 angka'
    }
  }

  // Validasi nama lengkap
  if (!formData.fullName) {
    errors.fullName = 'Nama lengkap wajib diisi'
  }

  return errors
}

export default function Register() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi form
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat registrasi')
      }

      // Simpan token di localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect ke halaman utama
      router.push('/')
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        submit: err.message
      }))
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
            Daftar Akun Baru
          </h1>
          <p className="text-gray-400">
            Bergabunglah dengan YR Music
          </p>
        </div>

        {/* Form Register */}
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500
                    ${errors.username ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="Masukkan username"
                />
                <User className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500
                    ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="nama@email.com"
                />
                <Mail className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500
                    ${errors.fullName ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="Masukkan nama lengkap"
                />
                <UserPlus className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
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
                  className={`w-full px-4 py-3 bg-black/30 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500
                    ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
                  placeholder="Masukkan password"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Error Message */}
            {errors.submit && (
              <div className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Mendaftar...' : 'Daftar'}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-400 text-sm">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-purple-500 hover:text-purple-400 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
} 