import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/app/lib/auth'

export async function POST(request) {
  const prisma = new PrismaClient()

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

    // Ambil dan validasi data dari request body
    let data
    try {
      data = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 400 })
    }

    const { amount, paymentMethod } = data

    // Validasi jumlah top up
    const parsedAmount = parseInt(amount)
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 10000) {
      return NextResponse.json({ error: 'Jumlah top up minimal Rp 10.000' }, { status: 400 })
    }

    // Validasi metode pembayaran
    const validPaymentMethods = ['BANK_TRANSFER', 'CREDIT_CARD', 'E_WALLET']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 })
    }

    // Cek user dan wallet
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { wallets: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    let wallet
    if (!user.wallets || user.wallets.length === 0) {
      // Buat wallet baru jika belum ada
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          walletType: 'MAIN',
          balance: 0
        }
      })
    } else {
      wallet = user.wallets[0]
    }

    // Lakukan top up dalam satu transaksi
    const result = await prisma.$transaction(async (tx) => {
      // Buat record transaksi
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: parsedAmount,
          type: 'TOPUP',
          status: 'SUCCESS',
          paymentMethod,
          description: `Top up via ${paymentMethod.replace('_', ' ').toLowerCase()}`
        }
      })

      // Update saldo wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: parsedAmount
          }
        }
      })

      return { transaction, wallet: updatedWallet }
    })

    // Ambil data user yang diperbarui
    const updatedUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        wallets: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Top up berhasil',
      user: updatedUser
    })

  } catch (error) {
    console.error('Top up error:', error)
    return NextResponse.json({ 
      error: error.message || 'Gagal melakukan top up'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 