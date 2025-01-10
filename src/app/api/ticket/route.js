import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

export async function POST(request) {
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
    const { eventId, walletType, quantity } = await request.json()

    if (!eventId || !walletType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Validasi tipe wallet
    const validWalletTypes = ['Rendi Pay', 'Dinda Pay', 'Erwin Pay']
    if (!validWalletTypes.includes(walletType)) {
      return NextResponse.json({ error: 'Tipe wallet tidak valid' }, { status: 400 })
    }

    // Ambil data event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        user: true // Include user data untuk mendapatkan username penjual
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    if (event.ticketQuantity <= 0) {
      return NextResponse.json({ error: 'Tiket sudah habis' }, { status: 400 })
    }

    // Ambil data wallet pembeli
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: decoded.userId,
        walletType: walletType
      }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet tidak ditemukan' }, { status: 404 })
    }

    if (wallet.balance < event.ticketPrice * quantity) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 })
    }

    // Lakukan transaksi dalam satu atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Kurangi saldo wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: event.ticketPrice * quantity
          }
        },
        include: {
          user: true
        }
      })

      // 2. Buat record transaksi
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: event.ticketPrice * quantity,
          type: 'PAYMENT',
          status: 'SUCCESS',
          referenceId: `TICKET-${event.id}`,
          description: `Pembelian ${quantity} tiket event "${event.name}"${updatedWallet.user?.username ? ` oleh ${updatedWallet.user.username}` : ''}`
        }
      })

      // 3. Kurangi jumlah tiket event
      const updatedEvent = await tx.event.update({
        where: { id: event.id },
        data: {
          ticketQuantity: {
            decrement: quantity
          }
        },
        include: {
          user: true
        }
      })

      // 4. Buat record tiket
      const ticket = await tx.ticket.create({
        data: {
          eventId: event.id,
          userId: decoded.userId,
          purchaseDate: new Date(),
          price: event.ticketPrice * quantity,
          status: 'active',
          walletType: walletType
        }
      })

      // 5. Buat notifikasi untuk pembeli
      console.log('Creating buyer notification...')
      const buyerNotification = await tx.notification.create({
        data: {
          userId: decoded.userId,
          type: 'TICKET_PURCHASED',
          title: 'Pembelian Tiket Berhasil',
          message: `Anda${updatedWallet.user?.username ? ` (${updatedWallet.user.username})` : ''} telah berhasil membeli ${quantity} tiket untuk event "${event.name}" dari ${event.user.username}. Event akan berlangsung pada tanggal ${new Date(event.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          })}.`,
          isRead: false
        }
      })
      console.log('Buyer notification created:', buyerNotification)

      // 6. Buat notifikasi untuk penjual
      console.log('Creating seller notification...')
      const sellerNotification = await tx.notification.create({
        data: {
          userId: event.userId,
          type: 'TICKET_SOLD',
          title: 'Tiket Terjual',
          message: `${quantity} tiket untuk event "${event.name}" telah dibeli${updatedWallet.user?.username ? ` oleh ${updatedWallet.user.username}` : ''}. Total pembayaran: Rp ${(event.ticketPrice * quantity).toLocaleString('id-ID')}. Sisa tiket: ${updatedEvent.ticketQuantity}.`,
          isRead: false
        }
      })
      console.log('Seller notification created:', sellerNotification)

      return {
        wallet: updatedWallet,
        ticket,
        event: updatedEvent,
        transaction,
        notifications: {
          buyer: buyerNotification,
          seller: sellerNotification
        }
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Purchase ticket error:', error)
    return NextResponse.json({ 
      error: 'Gagal membeli tiket'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

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

    // Ambil tiket user
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        event: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tickets)

  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json({ 
      error: 'Gagal mengambil tiket'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 