import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword, generateToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

// Default avatar sebagai base64 SVG
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNmIyMWE4Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI4MCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI4MCIgeT0iMjQwIiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjE2MCIgcng9IjgwIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg=='

// Validasi email dengan regex
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validasi username
function isValidUsername(username) {
  // Hanya boleh huruf, angka, underscore, dan titik
  const usernameRegex = /^[a-zA-Z0-9._]+$/
  return usernameRegex.test(username)
}

// Validasi password
function validatePassword(password) {
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const isLongEnough = password.length >= 6

  return {
    isValid: hasLetter && hasNumber && isLongEnough,
    hasLetter,
    hasNumber,
    isLongEnough
  }
}

export async function POST(req) {
  try {
    const { username, email, password, fullName } = await req.json()

    // Validasi input
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Validasi username
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      )
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username hanya boleh mengandung huruf, angka, underscore, dan titik' },
        { status: 400 }
      )
    }

    // Validasi email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Validasi password dengan pesan yang lebih spesifik
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isLongEnough) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }
    if (!passwordValidation.hasLetter) {
      return NextResponse.json(
        { error: 'Password harus mengandung minimal 1 huruf' },
        { status: 400 }
      )
    }
    if (!passwordValidation.hasNumber) {
      return NextResponse.json(
        { error: 'Password harus mengandung minimal 1 angka' },
        { status: 400 }
      )
    }

    // Cek apakah username atau email sudah digunakan
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username sudah digunakan' },
          { status: 400 }
        )
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        profile: {
          create: {
            bio: '',
            avatarUrl: defaultAvatar
          }
        },
        wallets: {
          create: [
            { walletType: 'Rendi Pay', balance: 0 },
            { walletType: 'Dinda Pay', balance: 0 },
            { walletType: 'Erwin Pay', balance: 0 }
          ]
        }
      },
      include: {
        profile: true,
        wallets: true
      }
    })

    // Generate token
    const token = generateToken(user.id)

    // Buat session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
      }
    })

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json({
      message: 'Registrasi berhasil',
      user: userWithoutPassword,
      token
    })

    // Set cookie untuk token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 hari dalam detik
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 