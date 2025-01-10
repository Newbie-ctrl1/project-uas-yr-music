import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Hash password
export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  } catch (error) {
    console.error('Hash password error:', error)
    throw new Error('Gagal mengenkripsi password')
  }
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Verify password error:', error)
    throw new Error('Gagal memverifikasi password')
  }
}

// Generate JWT token
export function generateToken(userId) {
  try {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  } catch (error) {
    console.error('Generate token error:', error)
    throw new Error('Gagal membuat token')
  }
}

// Verify JWT token
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || typeof decoded !== 'object') {
      console.error('Invalid token structure')
      return null
    }

    const userId = parseInt(decoded.userId)
    if (isNaN(userId)) {
      console.error('Invalid userId in token')
      return null
    }

    return { ...decoded, userId }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Get user by token
export async function getUserFromToken(token) {
  try {
    const decoded = verifyToken(token)
    if (!decoded) {
      console.error('Failed to verify token')
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        wallets: true
      }
    })

    if (!user) {
      console.error('User not found for token')
      return null
    }

    return user
  } catch (error) {
    console.error('Get user from token error:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
} 