import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export async function POST(request) {
  try {
    // Ambil token dari header
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    // Verifikasi token
    let payload
    try {
      payload = verifyToken(token)
    } catch (err) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token tidak valid atau tidak memiliki userId' }, { status: 401 })
    }

    // Ambil ID tiket dari URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const ticketId = parseInt(pathParts[pathParts.length - 1])

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'ID tiket tidak valid' }, { status: 400 })
    }

    // Cek apakah tiket ada dan milik event user yang login
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        event: {
          userId: parseInt(payload.userId)
        }
      },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan atau bukan milik event Anda' }, { status: 404 })
    }

    if (ticket.isSent) {
      return NextResponse.json({ error: 'Tiket sudah dikirim sebelumnya' }, { status: 400 })
    }

    // Update status tiket menjadi terkirim
    const now = new Date()
    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticketId
      },
      data: {
        status: 'sent',
        isSent: true,
        sentAt: now,
        updatedAt: now
      }
    })

    // Buat notifikasi untuk pembeli
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: 'TICKET_SENT',
        title: 'Tiket Telah Dikirim',
        message: `Tiket untuk event "${ticket.event.name}" telah dikirim. Silakan cek silahkan cek di halaman pembelian tiket.`,
        isRead: false
      }
    })

    return NextResponse.json({
      message: 'Tiket berhasil dikirim',
      ticket: updatedTicket
    })

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim tiket' 
    }, { status: 500 })
  }
} 