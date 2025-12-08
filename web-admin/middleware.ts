import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const path = request.nextUrl.pathname;

    // 1. Nếu là trang Auth (Login/Register)
    if (path.startsWith('/login') || path.startsWith('/register')) {
        // Nếu đã có token -> Redirect về Dashboard
        if (token) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 2. Nếu là các trang Protected (Dashboard, Admin)
    // Loại trừ static files, images, favicon
    if (
        !path.startsWith('/_next') &&
        !path.startsWith('/api') &&
        !path.startsWith('/static') &&
        !path.startsWith('/forgot-password') &&
        !path.startsWith('/reset-password') &&
        !path.includes('.') // file extension like .ico, .png
    ) {
        // Nếu KHÔNG có token -> Redirect về Login
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            // Có thể thêm ?redirect=... để quay lại trang cũ sau khi login
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Cấu hình matcher để tối ưu performance
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
