import { NextRequest, NextResponse } from 'next/server';

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') ?? url.host;
  const hostname = host.split(':')[0];

  const isDevelopment =
    process.env.NODE_ENV !== 'production' ||
    isLocalhost(hostname);

  if (!isDevelopment && forwardedProto === 'http') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
