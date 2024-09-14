import './global.css'

import { Metadata } from 'next'
import i18n from '../i18n'
import LocaleSwitcher from './components/locale-switcher'
import type { ChildrenProps, LocaleProps } from './propTypes'
import db from '../../src/db'
import HeaderNavigation from './components/header-navigation'

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }))
}

export default function Root(props: ChildrenProps & LocaleProps) {
    const {
        children,
        params: { lang },
    } = props

    return (
        <html lang={lang}>
            <body>
                <HeaderNavigation lang={lang} />
                <LocaleSwitcher current={lang} />
                {children}
            </body>
        </html>
    )
}

export async function generateMetadata(props: LocaleProps): Promise<Metadata> {
    const content = await db.getPage('/', props.params.lang)
    if (!content?.heading) {
        return {}
    }
    const { heading } = content

    return {
        title: heading,
        description: heading,
    }
}
