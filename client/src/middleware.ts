import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie or header
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/forgot-password'];
  const isPublicPath = publicPaths.includes(pathname);

  // Auth paths (login, register, etc.)
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPath = authPaths.includes(pathname);

  // Dashboard paths require authentication
  const isDashboardPath = pathname.startsWith('/dashboard');

  // Admin paths require authentication and admin role
  const isAdminPath = pathname.startsWith('/admin');

  // If trying to access dashboard or admin without token, redirect to login
  if ((isDashboardPath || isAdminPath) && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth pages, redirect appropriately
  if (isAuthPath && token) {
    // Try to decode token to get user role (basic JWT decode without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch (e) {
      // If token decode fails, redirect to dashboard
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For admin paths, verify the user has admin role
  if (isAdminPath && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Middleware - Admin path, token payload:', payload);
      console.log('Middleware - Role:', payload.role);
      // If user is NOT an admin, redirect to dashboard
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
        console.log('Middleware - Not admin, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      console.log('Middleware - Admin access granted');
      // User is admin, allow access
    } catch (error) {
      console.log('Middleware - Token decode error:', error);
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
