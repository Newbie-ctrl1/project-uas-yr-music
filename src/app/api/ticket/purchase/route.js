import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export async function POST(request) {
  try {
    // Ambil token dari header
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verifikasi token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    // Ambil data dari body request
    const { eventId, quantity, totalAmount, walletType } = await request.json()

    // Validasi input
    if (!eventId || !quantity || !totalAmount || !walletType) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Validasi wallet type
    const validWalletTypes = ['Rendi Pay', 'Dinda Pay', 'Erwin Pay']
    if (!validWalletTypes.includes(walletType)) {
      return NextResponse.json(
        { error: 'Tipe wallet tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah event ada dan masih tersedia
    const event = await prisma.event.findUnique({
      where: {
        id: parseInt(eventId)
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek apakah user membeli tiket eventnya sendiri
    if (event.userId === parseInt(payload.userId)) {
      return NextResponse.json(
        { error: 'Anda tidak dapat membeli tiket untuk event Anda sendiri' },
        { status: 400 }
      )
    }

    // Cek saldo wallet
    const buyerWallet = await prisma.wallet.findFirst({
      where: {
        userId: parseInt(payload.userId),
        walletType: walletType
      }
    })

    if (!buyerWallet || buyerWallet.balance < totalAmount) {
      return NextResponse.json(
        { error: 'Saldo wallet tidak mencukupi' },
        { status: 400 }
      )
    }

    // Cek wallet penjual dengan tipe yang sama
    const sellerWallet = await prisma.wallet.findFirst({
      where: {
        userId: event.userId,
        walletType: walletType
      }
    })

    if (!sellerWallet) {
      return NextResponse.json(
        { error: 'Penjual tidak memiliki wallet yang sesuai' },
        { status: 400 }
      )
    }

    // Mulai transaksi
    const transaction = await prisma.$transaction(async (prisma) => {
      // Kurangi saldo wallet pembeli
      const updatedBuyerWallet = await prisma.wallet.update({
        where: {
          id: buyerWallet.id
        },
        data: {
          balance: {
            decrement: totalAmount
          }
        }
      })

      // Tambah saldo ke wallet penjual
      const updatedSellerWallet = await prisma.wallet.update({
        where: {
          id: sellerWallet.id
        },
        data: {
          balance: {
            increment: totalAmount
          }
        }
      })

      // Buat transaksi pembayaran
      const paymentTransaction = await prisma.transaction.create({
        data: {
          walletId: buyerWallet.id,
          amount: -totalAmount,
          type: 'PAYMENT',
          status: 'SUCCESS',
          referenceId: event.id.toString(),
          description: `Pembelian ${quantity} tiket untuk event ${event.name} menggunakan ${walletType}`
        }
      })

      // Buat transaksi penerimaan untuk penjual
      const sellerTransaction = await prisma.transaction.create({
        data: {
          walletId: sellerWallet.id,
          amount: totalAmount,
          type: 'TRANSFER',
          status: 'SUCCESS',
          referenceId: event.id.toString(),
          description: `Penerimaan pembayaran ${quantity} tiket untuk event ${event.name} melalui ${walletType}`
        }
      })

      // Buat tiket
      const tickets = await Promise.all(
        Array(quantity).fill(0).map(() =>
          prisma.ticket.create({
            data: {
              eventId: event.id,
              userId: parseInt(payload.userId),
              purchaseDate: new Date(),
              price: totalAmount / quantity,
              status: 'active',
              walletType: walletType
            }
          })
        )
      )

      // Buat notifikasi untuk pembeli
      const buyerNotification = await prisma.notification.create({
        data: {
          userId: parseInt(payload.userId),
          type: 'TICKET_PURCHASED',
          title: 'Pembelian Tiket Berhasil',
          message: `Anda telah berhasil membeli ${quantity} tiket untuk event "${event.name}". Event akan berlangsung pada tanggal ${new Date(event.date).toLocaleDateString()}.`,
          isRead: false
        }
      })

      // Buat notifikasi untuk penjual
      const sellerNotification = await prisma.notification.create({
        data: {
          userId: event.userId,
          type: 'TICKET_SOLD',
          title: 'Tiket Terjual',
          message: `${quantity} tiket untuk event "${event.name}" telah terjual.`,
          isRead: false
        }
      })

      return { 
        buyerWallet: updatedBuyerWallet, 
        tickets,
        paymentTransaction,
        sellerTransaction,
        notifications: {
          buyer: buyerNotification,
          seller: sellerNotification
        }
      }
    })

    return NextResponse.json({
      message: 'Pembelian tiket berhasil',
      tickets: transaction.tickets,
      walletBalance: transaction.buyerWallet.balance,
      transaction: transaction.paymentTransaction,
      notifications: transaction.notifications
    })

  } catch (error) {
    console.error('Error in ticket purchase API:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat melakukan pembelian tiket' },
      { status: 500 }
    )
  }
} 