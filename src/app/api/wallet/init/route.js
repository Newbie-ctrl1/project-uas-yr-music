import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function POST(request) {
  try {
    // Ambil semua user
    const users = await prisma.user.findMany({
      include: {
        wallets: true
      }
    })

    const results = []

    // Proses setiap user
    for (const user of users) {
      const walletTypes = ['Rendi Pay', 'Dinda Pay', 'Erwin Pay']
      const existingWalletTypes = user.wallets.map(w => w.walletType)
      
      // Cek wallet yang belum ada
      const missingWalletTypes = walletTypes.filter(type => !existingWalletTypes.includes(type))

      if (missingWalletTypes.length > 0) {
        // Buat wallet yang belum ada
        const newWallets = await prisma.$transaction(
          missingWalletTypes.map(type => 
            prisma.wallet.create({
              data: {
                userId: user.id,
                walletType: type,
                balance: 0
              }
            })
          )
        )

        results.push({
          userId: user.id,
          username: user.username,
          createdWallets: newWallets.map(w => w.walletType)
        })
      }
    }

    return NextResponse.json({
      message: 'Inisialisasi wallet berhasil',
      results
    })

  } catch (error) {
    console.error('Error initializing wallets:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat inisialisasi wallet' },
      { status: 500 }
    )
  }
} 