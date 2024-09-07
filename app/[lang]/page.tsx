import i18n, { type Locale } from '../i18n'
import LocaleSwitcher from './components/locale-switcher'

type PageWithLocaleProps = {
    params: { lang?: Locale }
}

export default function PageWithLocale(props: PageWithLocaleProps) {
    const locale = props.params.lang ?? i18n.defaultLocale
    const content = i18n.getContent(locale)

    const { heading, message } = content

    return (
        <>
            <div className="container">
                <h1>
                    <a href="/">{heading}</a>
                </h1>
                <p>{message}</p>
                <LocaleSwitcher current={locale} />
            </div>
        </>
    )
}
