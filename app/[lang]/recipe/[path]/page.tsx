import { notFound } from 'next/navigation'
import Database from '~src/db'
import type { PageParams } from '~src/types'

export default async function PageWithLocale(props: PageParams) {
    const { lang, path } = await props.params
    const content = await new Database().getPage(`/recipe/${path}`, lang)
    if (!content) {
        return notFound()
    }
    const { heading, body } = content

    return (
        <article className="container">
            <h1>
                {' '}
                <a href={`/${lang}/recipe/${path}`}>{heading}</a>{' '}
            </h1>
            {body && <main dangerouslySetInnerHTML={{ __html: body }}></main>}
        </article>
    )
}
