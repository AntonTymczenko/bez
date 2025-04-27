'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import type { LinksState } from './header-navigation-container'
import styles from './styles/header-navigation.module.scss'

type HeaderNavigationProps = {
    homeLink: string
    links: LinksState[]
}

export default function HeaderNavigation(props: HeaderNavigationProps) {
    const { homeLink, links } = props

    const [scrolled, setScrolled] = useState(false)
    const [hideTitle, setHideTitle] = useState(false)
    const [title, setTitle] = useState<string | null>(null)

    useEffect(() => {
        function onScroll() {
            const y = window.scrollY
            setScrolled(y > 0)
            setHideTitle(y > 100)
        }
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        setTitle(document.title)
    }, [links])

    return (
        <header
            className={`${styles.headerNavigation} ${scrolled ? styles.scrolled : ''}`}
        >
            <div className={styles.headerSideLeft}>
                <Link href={homeLink} className={styles.homeLink}>
                    🏠
                </Link>
            </div>

            {title && (
                <div
                    className={`${styles.headerCenter} ${hideTitle ? styles.hidden : ''}`}
                >
                    <p className={styles.headerTitle}>{title}</p>
                </div>
            )}

            <div className={styles.headerSideRight}>
                <div className={styles.localeSwitcher}>
                    {links.map(([locale, flag, href]) => (
                        <React.Fragment key={locale}>
                            {href === homeLink ? (
                                <span>{flag}</span>
                            ) : (
                                <Link href={href}>{flag}</Link>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </header>
    )
}
