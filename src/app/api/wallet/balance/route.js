import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export async function GET(request) {
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

    // Ambil semua wallet user
    const wallets = await prisma.wallet.findMany({
      where: {
        userId: parseInt(payload.userId)
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    // Jika belum ada wallet sama sekali, buat wallet default
    if (wallets.length === 0) {
      const defaultWallets = await prisma.$transaction([
        prisma.wallet.create({
          data: {
            userId: parseInt(payload.userId),
            walletType: 'Rendi Pay',
            balance: 0
          }
        }),
        prisma.wallet.create({
          data: {
            userId: parseInt(payload.userId),
            walletType: 'Dinda Pay',
            balance: 0
          }
        }),
        prisma.wallet.create({
          data: {
            userId: parseInt(payload.userId),
            walletType: 'Erwin Pay',
            balance: 0
          }
        })
      ])

      return NextResponse.json({ 
        wallets: defaultWallets.map(wallet => ({
          id: wallet.id,
          type: wallet.walletType,
          balance: wallet.balance,
          transactions: []
        })),
        message: 'Wallet berhasil dibuat'
      })
    }

    return NextResponse.json({ 
      wallets: wallets.map(wallet => ({
        id: wallet.id,
        type: wallet.walletType,
        balance: wallet.balance,
        transactions: wallet.transactions
      }))
    })
  } catch (error) {
    console.error('Error in wallet balance API:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil saldo wallet' },
      { status: 500 }
    )
  }
} 