import './global.css'

import { Metadata } from 'next'
import i18n from '../i18n'
import LocaleSwitcher from './components/locale-switcher'
import type { ChildrenProps, LocaleProps } from './propTypes'

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }))
}

// TODO: put link to the main page
export default function Root(props: ChildrenProps & LocaleProps) {
    const {
        children,
        params: { lang },
    } = props

    return (
        <html lang={lang}>
            <body>
                <LocaleSwitcher current={lang} />
                {children}
            </body>
        </html>
    )
}

export async function generateMetadata(props: LocaleProps): Promise<Metadata> {
    const { heading } = i18n.getDictionary(props.params.lang)

    return {
        title: heading,
        description: heading,
    }
}
