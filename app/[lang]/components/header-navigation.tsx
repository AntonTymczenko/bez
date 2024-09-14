import React from 'react'
import Link from 'next/link'

export default function HeaderNavigation(props) {
    const { lang = '' } = props

    return (
        <div className="header-navigation">
            <Link href={lang ? `/${lang}/` : '/'}>🏠</Link>
        </div>
    )
}
