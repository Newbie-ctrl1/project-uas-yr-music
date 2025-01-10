import { NextResponse } from 'next/server'

export function middleware(request) {
  // Ambil token dari cookies
  const token = request.cookies.get('token')?.value

  // Daftar rute yang memerlukan login
  const protectedRoutes = ['/play', '/event', '/profile', '/perdagangan']
  
  // Daftar rute autentikasi
  const authRoutes = ['/auth/login', '/auth/register']

  // Cek jika rute saat ini memerlukan login
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Cek jika rute saat ini adalah rute autentikasi
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Jika user sudah login dan mencoba mengakses halaman auth
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Jika user belum login dan mencoba mengakses rute yang dilindungi
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

// Konfigurasi rute yang akan diproses oleh middleware
export const config = {
  matcher: [
    '/play/:path*',
    '/event/:path*',
    '/profile/:path*',
    '/perdagangan/:path*',
    '/auth/:path*'
  ]
} 