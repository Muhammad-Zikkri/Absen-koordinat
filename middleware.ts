import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // 1. Content Security Policy (CSP)
    // Helps prevent Cross-Site Scripting (XSS) and data injection attacks.
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' blob: data: https://unpkg.com https://*.tile.openstreetmap.org;
        connect-src 'self';
        worker-src 'self' blob:;
        frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);

    // 2. Strict Transport Security (HSTS)
    // Forces HTTPS connections.
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. X-Frame-Options
    // Prevents Clickjacking by disallowing the site to be embedded in an iframe.
    response.headers.set('X-Frame-Options', 'DENY');

    // 4. X-Content-Type-Options
    // Prevents MIME-sniffing.
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // 5. Referrer-Policy
    // Controls how much referrer information is shared.
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions-Policy
    // Restricts the use of browser features (Camera and Geolocation allowed for this app).
    response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');

    return response;
}

export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
