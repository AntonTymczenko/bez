import './global.css'

import { Metadata } from 'next'
import i18n, { type Locale } from '../i18n'

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }))
}

export default function Root({
    children,
    params,
}: {
    children: React.ReactNode
    params: { lang: Locale }
}) {
    return (
        <html lang={params.lang}>
            <body>{children}</body>
        </html>
    )
}

export async function generateMetadata(props): Promise<Metadata> {
    const { heading } = i18n.getContent(props.params.lang)

    return {
        title: heading,
        description: heading,
    }
}
