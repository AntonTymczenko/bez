import Link from 'next/link'
import type { HeaderNavigationProps } from '~src/types'
import LocaleSwitcher from './locale-switcher'

export default function HeaderNavigation(props: HeaderNavigationProps) {
    const { currentLocale } = props

    return (
        <div className="header-navigation">
            <Link href={`/${currentLocale}/`}>🏠</Link>
            <LocaleSwitcher {...props} />
        </div>
    )
}
