import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export async function POST(request) {
  try {
    // Verifikasi token
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

    // Ambil dan validasi data dari request body
    const data = await request.json()
    const { amount, walletType } = data

    // Validasi jumlah top up
    const parsedAmount = parseInt(amount)
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 10000) {
      return NextResponse.json(
        { error: 'Jumlah top up minimal Rp 10.000' },
        { status: 400 }
      )
    }

    // Validasi tipe wallet
    const validWalletTypes = ['Rendi Pay', 'Dinda Pay', 'Erwin Pay']
    if (!walletType || !validWalletTypes.includes(walletType)) {
      return NextResponse.json(
        { error: 'Tipe wallet tidak valid' },
        { status: 400 }
      )
    }

    // Cek wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: parseInt(payload.userId),
        walletType: walletType
      }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet tidak ditemukan' },
        { status: 404 }
      )
    }

    // Lakukan top up dalam satu transaksi
    const transaction = await prisma.$transaction(async (tx) => {
      // Buat record transaksi
      const trx = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: parsedAmount,
          type: 'TOPUP',
          status: 'SUCCESS',
          description: `Top up ${walletType} sebesar Rp ${parsedAmount.toLocaleString('id-ID')}`
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

      return { trx, wallet: updatedWallet }
    })

    // Ambil data wallet yang diperbarui beserta transaksi terakhir
    const updatedWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({
      message: 'Top up berhasil',
      wallet: {
        id: updatedWallet.id,
        type: updatedWallet.walletType,
        balance: updatedWallet.balance,
        transactions: updatedWallet.transactions
      }
    })

  } catch (error) {
    console.error('Top up error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat melakukan top up' },
      { status: 500 }
    )
  }
} 