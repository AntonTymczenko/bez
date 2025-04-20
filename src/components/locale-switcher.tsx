'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { type Locale } from '~src/types'

type LocaleSwitcherProps = {
    current: Locale
    locales: [Locale, string][]
    path?: string
}

type Flag = string
type Href = string
type LinksState = [Locale, Flag, Href]

function LocaleSwitcher(props: LocaleSwitcherProps) {
    const { current, locales } = props
    const path = usePathname()

    const redirectedPathName = useCallback(
        (locale: Locale) => {
            const segments = (path ?? '/').split('/')
            segments[1] = locale
            return segments.join('/')
        },
        [path]
    )
    const [links, setLinks] = useState<LinksState[]>(
        locales.map(
            ([locale, flag]) =>
                [
                    locale,
                    flag,
                    locale === current ? path : redirectedPathName(locale),
                ] as LinksState
        )
    )

    useEffect(() => {
        Promise.all(
            links.map((linkState) =>
                linkState[0] === current
                    ? true
                    : fetch(linkState[2], { method: 'HEAD' })
                          .then((response) => response.status !== 404)
                          .catch(() => false)
            )
        ).then((validIndexes) => {
            if (validIndexes.every((x) => x === true)) {
                return
            }

            const updatedLinks: LinksState[] = []

            validIndexes.forEach((valid, index) => {
                if (valid) {
                    updatedLinks.push(links[index])
                }
            })

            setLinks(updatedLinks)
        })
    }, [path, current, locales])

    return (
        <div className="locale-switcher">
            {links.map(([locale, flag, href]) => (
                <React.Fragment key={locale}>
                    {locale === current ? (
                        <span>{flag}</span>
                    ) : (
                        <Link href={href}>{flag}</Link>
                    )}{' '}
                </React.Fragment>
            ))}
        </div>
    )
}

export default memo(LocaleSwitcher)
