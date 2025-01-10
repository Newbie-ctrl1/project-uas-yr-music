import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export async function GET(request) {
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
    } catch (error) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token tidak valid atau tidak memiliki userId' }, { status: 401 })
    }

    // Ambil parameter tipe dari query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'buy' atau 'sell'

    // Ambil tiket berdasarkan tipe
    const tickets = await prisma.ticket.findMany({
      where: {
        // Jika buy, ambil tiket yang dibeli user
        // Jika sell, ambil tiket dari event yang dibuat user
        ...(type === 'buy' 
          ? { userId: parseInt(payload.userId) }
          : { event: { userId: parseInt(payload.userId) } }
        )
      },
      include: {
        event: {
          select: {
            name: true,
            date: true,
            userId: true
          }
        },
        // Tambahkan relasi ke notifikasi
        user: {
          select: {
            notifications: {
              where: {
                OR: [
                  { type: 'TICKET_PURCHASED' },
                  { type: 'TICKET_SOLD' }
                ]
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })

    // Format data tiket
    const formattedTickets = tickets.map(ticket => {
      // Cari kode tiket dari pesan notifikasi
      const notification = ticket.user.notifications.find(n => 
        n.message.includes('Kode Tiket') && 
        n.message.includes(ticket.event.name)
      )
      
      let ticketCode = ''
      if (notification) {
        // Ekstrak kode tiket dari pesan notifikasi
        const match = notification.message.match(/Kode Tiket(?:\sAnda)?:\s+(TIX-[\w-]+)/)
        if (match) {
          ticketCode = match[1]
        }
      }

      return {
        id: ticket.id,
        eventId: ticket.eventId,
        userId: ticket.userId,
        amount: ticket.price,
        status: ticket.status,
        createdAt: ticket.purchaseDate.toISOString(),
        walletType: ticket.walletType,
        description: `${type === 'buy' ? 'Pembelian' : 'Penjualan'} tiket untuk event "${ticket.event.name}"`,
        eventName: ticket.event.name,
        eventDate: ticket.event.date.toISOString(),
        ticketCode: ticketCode
      }
    })

    return NextResponse.json(formattedTickets)

  } catch (error) {
    console.error('Error in transactions API:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data transaksi' }, { status: 500 })
  }
} 