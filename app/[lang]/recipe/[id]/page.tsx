import db from '../../../../src/db'
import { LocaleProps } from '../../propTypes'

type Props = LocaleProps & {
    params: { id: string }
}

export default async function PageWithLocale(props: Props) {
    const { lang, id } = props.params
    const content = await db.getPage('/recipe', lang)

    const { heading, body } = content ?? {}

    return (
        content && (
            <div className="container">
                <h1>
                    <a href={`/recipe/${id}`}>{heading}</a>
                </h1>
                <p>{`ID ${id}`}</p>
                <p>{body}</p>
            </div>
        )
    )
}
