import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const OFFICE_LAT = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || '0');
const OFFICE_LNG = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || '0');
const ALLOWED_RADIUS = parseInt(process.env.NEXT_PUBLIC_ALLOWED_RADIUS || '100');

// Simple Rate Limiting (In-memory mock for demo)
const rateLimitMap: Map<string, { count: number, last: number }> = new Map<string, { count: number, last: number }>();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function POST(request: Request) {
    try {
        const headerList = headers();
        const origin = headerList.get('origin');
        const host = headerList.get('host');
        
        // 1. Origin Protection
        if (process.env.NODE_ENV === 'production' && !origin?.includes(host || '')) {
            return NextResponse.json({ error: 'Illegal Origin' }, { status: 403 });
        }

        const ip = headerList.get('x-forwarded-for') || 'unknown';
        
        // 2. Rate Limiting (Max 5 requests per minute per IP)
        const now = Date.now();
        const userRate = rateLimitMap.get(ip) || { count: 0, last: now };
        if (now - userRate.last < 60000) {
            if (userRate.count > 5) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            userRate.count++;
        } else {
            userRate.count = 1;
            userRate.last = now;
        }
        rateLimitMap.set(ip, userRate);

        const body = await request.json();
        
        // 3. Input Sanitization
        const employeeId = String(body.employeeId).trim().substring(0, 50);
        const status = String(body.status).trim();
        const type = String(body.type).trim();
        const lat = parseFloat(body.lat);
        const lng = parseFloat(body.lng);

        if (!employeeId || isNaN(lat) || isNaN(lng)) {
            return NextResponse.json({ error: 'Invalid Input Data' }, { status: 400 });
        }

        // 4. Server-Side GPS Security
        if (status === 'HADIR') {
            const distance = calculateDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
            if (distance > ALLOWED_RADIUS) {
                return NextResponse.json({ error: 'GPS Spoofing Detected' }, { status: 403 });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Secured Log Entry Created',
            server_time: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json({ error: 'Security breach or internal error' }, { status: 500 });
    }
}
