import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create Secure HTTP-Only Cookie
        const cookie = serialize('admin_session', 'authenticated_true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/',
        });

        const response = NextResponse.json({ success: true, message: 'Admin authenticated' });
        response.headers.set('Set-Cookie', cookie);

        return response;

    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
