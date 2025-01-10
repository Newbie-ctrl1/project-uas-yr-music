import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/app/lib/auth'

const prisma = new PrismaClient()

// Fungsi untuk mendapatkan placeholder image
const getPlaceholderImage = () => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNmIyMWE4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RXZlbnQgUG9zdGVyPC90ZXh0Pjwvc3ZnPg=='
}

// Fungsi untuk mengkonversi file ke base64
const convertFileToBase64 = async (file) => {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return `data:${file.type};base64,${buffer.toString('base64')}`
}

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

    // Verifikasi user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    
    // Validasi input
    const name = formData.get('name')
    const type = formData.get('type')
    const date = formData.get('date')
    const time = formData.get('time')
    const location = formData.get('location')
    const description = formData.get('description')
    const poster = formData.get('poster')
    const ticketPrice = parseFloat(formData.get('ticketPrice'))
    const ticketQuantity = parseInt(formData.get('ticketQuantity'))

    // Validasi semua field
    if (!name || !type || !date || !time || !location || !description || !poster) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    // Validasi harga dan jumlah tiket
    if (isNaN(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json({ error: 'Harga tiket tidak valid' }, { status: 400 })
    }

    if (isNaN(ticketQuantity) || ticketQuantity <= 0) {
      return NextResponse.json({ error: 'Jumlah tiket tidak valid' }, { status: 400 })
    }

    // Konversi poster ke base64
    const posterUrl = await convertFileToBase64(poster)

    try {
      // Simpan event ke database
      const event = await prisma.event.create({
        data: {
          name,
          type,
          date: new Date(date),
          time,
          location,
          description,
          posterUrl,
          ticketPrice,
          ticketQuantity,
          userId: user.id
        }
      })

      return NextResponse.json({
        message: 'Event berhasil dibuat',
        event
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Gagal menyimpan event ke database. Silakan coba lagi.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Create event error:', error.message || error)
    return NextResponse.json({ 
      error: 'Gagal membuat event. Silakan coba lagi.'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request) {
  try {
    // Ambil semua event
    const events = await prisma.event.findMany({
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(events)

  } catch (error) {
    console.error('Get events error:', error.message || error)
    return NextResponse.json({ 
      error: 'Gagal mengambil data event'
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

    // Parse form data
    const formData = await request.formData()
    const eventId = parseInt(formData.get('id'))
    
    // Validasi input
    const name = formData.get('name')
    const type = formData.get('type')
    const date = formData.get('date')
    const time = formData.get('time')
    const location = formData.get('location')
    const description = formData.get('description')
    const poster = formData.get('poster')
    const ticketPrice = parseFloat(formData.get('ticketPrice'))
    const ticketQuantity = parseInt(formData.get('ticketQuantity'))

    // Validasi semua field
    if (!name || !type || !date || !time || !location || !description) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    // Validasi harga dan jumlah tiket
    if (isNaN(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json({ error: 'Harga tiket tidak valid' }, { status: 400 })
    }

    if (isNaN(ticketQuantity) || ticketQuantity <= 0) {
      return NextResponse.json({ error: 'Jumlah tiket tidak valid' }, { status: 400 })
    }

    // Cek kepemilikan event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    if (existingEvent.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk mengedit event ini' }, { status: 403 })
    }

    // Konversi poster ke base64 jika ada poster baru
    let posterUrl = existingEvent.posterUrl
    if (poster && poster.size > 0) {
      posterUrl = await convertFileToBase64(poster)
    }

    // Update event di database
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        type,
        date: new Date(date),
        time,
        location,
        description,
        posterUrl,
        ticketPrice,
        ticketQuantity
      }
    })

    return NextResponse.json({
      message: 'Event berhasil diupdate',
      event: updatedEvent
    })

  } catch (error) {
    console.error('Update event error:', error.message || error)
    return NextResponse.json({ 
      error: 'Gagal mengupdate event. Silakan coba lagi.'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request) {
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

    // Ambil ID event dari query parameter
    const { searchParams } = new URL(request.url)
    const eventId = parseInt(searchParams.get('id'))

    if (!eventId || isNaN(eventId)) {
      return NextResponse.json({ error: 'ID event tidak valid' }, { status: 400 })
    }

    // Cek kepemilikan event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    if (event.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk menghapus event ini' }, { status: 403 })
    }

    // Hapus semua tiket terkait terlebih dahulu
    if (event.tickets.length > 0) {
      await prisma.ticket.deleteMany({
        where: { eventId: eventId }
      })
    }

    // Hapus event
    await prisma.event.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: 'Event berhasil dihapus' })

  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json({ 
      error: 'Gagal menghapus event. Silakan coba lagi.'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 