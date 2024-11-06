import db from '../../src/db'
import { LocaleProps } from './propTypes'

export default async function PageWithLocale(props: LocaleProps) {
    const { lang } = props.params
    const content = await db.getPage('/', lang)

    const { heading, body } = content ?? {}

    return (
        content && (
            <div className="homepage">
                <div className="container">
                    <h1>
                        <a href="/">{heading}</a>
                    </h1>
                    <p>{body}</p>
                </div>
            </div>
        )
    )
}
