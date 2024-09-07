'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import i18n, { type Locale } from '../../i18n'

type LocaleSwitcherProps = {
    current: Locale
}

export default function LocaleSwitcher(props: LocaleSwitcherProps) {
    const { current } = props

    const pathName = usePathname()
    const redirectedPathName = (locale: Locale) => {
        if (!pathName) return '/'
        const segments = pathName.split('/')
        segments[1] = locale
        return segments.join('/')
    }

    return (
        <div>
            {i18n.locales.map((locale) => {
                const flag = i18n.getFlag(locale)

                return (
                    <React.Fragment key={locale}>
                        {locale === current ? (
                            <span>{flag}</span>
                        ) : (
                            <Link href={redirectedPathName(locale)}>
                                {flag}
                            </Link>
                        )}{' '}
                    </React.Fragment>
                )
            })}
        </div>
    )
}
