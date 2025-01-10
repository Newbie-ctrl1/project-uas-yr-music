import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

export async function PUT(request) {
  try {
    // Verifikasi token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Format token tidak valid' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    // Parse request body
    const data = await request.json()
    console.log('Update profile data:', data)

    // Validasi data
    const updateData = {}

    if (data.fullName !== undefined) {
      if (data.fullName.trim().length < 3) {
        return NextResponse.json({ error: 'Nama lengkap minimal 3 karakter' }, { status: 400 })
      }
      if (data.fullName.trim().length > 50) {
        return NextResponse.json({ error: 'Nama lengkap maksimal 50 karakter' }, { status: 400 })
      }
      updateData.fullName = data.fullName.trim()
    }

    if (data.phone !== undefined) {
      const cleanPhone = data.phone.trim().replace(/\s+/g, '')
      if (!/^(\+62|62|0)[0-9]{9,12}$/.test(cleanPhone)) {
        return NextResponse.json({ error: 'Format nomor telepon tidak valid' }, { status: 400 })
      }
      updateData.phone = cleanPhone
    }

    if (data.address !== undefined) {
      if (data.address.trim().length < 10) {
        return NextResponse.json({ error: 'Alamat terlalu pendek, minimal 10 karakter' }, { status: 400 })
      }
      if (data.address.trim().length > 200) {
        return NextResponse.json({ error: 'Alamat terlalu panjang, maksimal 200 karakter' }, { status: 400 })
      }
      updateData.address = data.address.trim()
    }

    if (data.birthDate !== undefined) {
      const parsedDate = new Date(data.birthDate)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Format tanggal lahir tidak valid' }, { status: 400 })
      }
      const today = new Date()
      const age = today.getFullYear() - parsedDate.getFullYear()
      if (age < 13) {
        return NextResponse.json({ error: 'Usia minimal 13 tahun' }, { status: 400 })
      }
      if (age > 100) {
        return NextResponse.json({ error: 'Tanggal lahir tidak valid' }, { status: 400 })
      }
      updateData.birthDate = parsedDate
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: {
        id: decoded.userId
      },
      data: updateData,
      include: {
        wallets: true,
        profile: true
      }
    })

    console.log('User updated:', updatedUser)

    // Buat notifikasi untuk update profil
    await prisma.notification.create({
      data: {
        userId: decoded.userId,
        type: 'PROFILE_UPDATED',
        title: 'Profil Diperbarui',
        message: 'Profil Anda telah berhasil diperbarui.',
        isRead: false
      }
    })

    // Hapus password dari response
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({ 
      message: 'Profil berhasil diperbarui',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ 
      error: error.message || 'Gagal memperbarui profil'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 