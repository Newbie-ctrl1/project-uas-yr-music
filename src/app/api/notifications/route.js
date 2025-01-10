import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

export async function GET(request) {
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

    console.log('Fetching notifications for user:', decoded.userId)

    // Ambil notifikasi user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: decoded.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found notifications:', notifications)

    return NextResponse.json(notifications)

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ 
      error: 'Gagal mengambil notifikasi'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

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
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: 'ID notifikasi tidak valid' }, { status: 400 })
    }

    console.log('Marking notification as read:', notificationId)

    // Update status notifikasi menjadi sudah dibaca
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: decoded.userId
      },
      data: {
        isRead: true
      }
    })

    console.log('Updated notification:', notification)

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ 
      error: 'Gagal memperbarui notifikasi'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 