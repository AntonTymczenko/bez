// import db from '../../../../src/db'
import markdownToHtml from '../../../../src/md-to-html'
import { LocaleProps } from '../../propTypes'

type Props = LocaleProps & {
    params: { id: string }
}

export default async function PageWithLocale(props: Props) {
    const { lang, id } = props.params
    // const content = await db.getPage('/recipe', lang)
    // const { heading, body } = content ?? {}
    const { heading, body } = await markdownToHtml()

    return (
        <article className="container">
            {heading && (
                <h1>
                    {' '}
                    <a href={`/recipe/${id}`}>{heading}</a>{' '}
                </h1>
            )}
            {body && <main dangerouslySetInnerHTML={{ __html: body }}></main>}
        </article>
    )
}
