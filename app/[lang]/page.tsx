import i18n from '../i18n'
import { LocaleProps } from './propTypes'

export default function PageWithLocale(props: LocaleProps) {
    const locale = props.params.lang ?? i18n.defaultLocale
    const dictionary = i18n.getDictionary(locale)

    const { heading, message } = dictionary

    return (
        <>
            <div className="container">
                <h1>
                    <a href="/">{heading}</a>
                </h1>
                <p>{message}</p>
            </div>
        </>
    )
}
