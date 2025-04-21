import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import Config from '~src/config'
import I18n from '~src/i18n'

function getHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => (headers[key] = value))

    return headers
}

const i18n = new I18n(Config.locales)

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    /**
     * `/_next/` and `/api/` are ignored by the watcher,
     * but we need to ignore files in `public` manually.
     *
     * Add your other files in `public` if you have some
     */
    if (
        [
            '/favicon.ico',
            '/.well-known/security.txt',
            '/.well-known/pgp-public.asc',
        ].includes(pathname) ||
        pathname.startsWith('/img')
    ) {
        return
    }

    // Check if there is any supported locale in the pathname
    const localeRecognized = i18n.localeRecognizedInPath(pathname)

    // Redirect
    if (!localeRecognized) {
        // Negotiator expects plain object so we need to transform headers
        const headers = getHeaders(request)
        const locale = i18n.getLocale(headers)

        // e.g. incoming request is /products
        // The new URL is now /en-US/products
        return NextResponse.redirect(
            new URL(
                `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
                request.url
            )
        )
    }
}

export const config = {
    // Matcher ignoring `/_next/` and `/api/`
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
