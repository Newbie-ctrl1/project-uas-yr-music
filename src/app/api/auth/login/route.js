import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, generateToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    console.log('Login attempt for username:', username)

    // Validasi input
    if (!username) {
      return NextResponse.json(
        { error: 'Username atau email harus diisi' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password harus diisi' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan username atau email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        profile: true,
        wallets: true
      }
    })

    console.log('User found:', user ? 'Yes' : 'No')

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isValid = await verifyPassword(password, user.password)
    console.log('Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    // Hapus session lama jika ada
    await prisma.session.deleteMany({
      where: {
        userId: user.id
      }
    })

    // Generate token
    const token = generateToken(user.id)

    // Buat session baru
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
      }
    })

    console.log('Session created:', session.id)

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json({
      message: 'Login berhasil',
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login. Silakan coba lagi.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 