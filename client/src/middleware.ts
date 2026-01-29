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

  // For admin paths, we need to verify the user role
  // This should be done by decoding the JWT token
  // For now, we'll let the API handle the role verification
  // The middleware will just ensure the user is authenticated

  if (isAdminPath && token) {
    try {
      // In a real app, you would decode the JWT token here to check the role
      // For now, we'll let the page components handle the role check
      // and redirect if necessary

      // Example of what you might do:
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // if (decoded.role !== 'admin') {
      //   return NextResponse.redirect(new URL('/dashboard', request.url));
      // }
    } catch (error) {
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
