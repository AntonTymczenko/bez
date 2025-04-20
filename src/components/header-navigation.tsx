import React from 'react'
import Link from 'next/link'
import type { Locale } from '~src/types'

export default function HeaderNavigation(props: { lang: Locale }) {
    const { lang } = props

    return (
        <div className="header-navigation">
            <Link href={lang ? `/${lang}/` : '/'}>🏠</Link>
        </div>
    )
}
