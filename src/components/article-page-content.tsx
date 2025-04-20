import type { PageContentFace, PageParams } from '~src/types'

export default async function ArticlePageConent(
    props: PageContentFace & PageParams
) {
    const { heading, body } = props
    const { lang, path } = await props.params

    return (
        <div className="homepage">
            <div className="container">
                <h1>
                    <a href={`/${lang}/${path ?? ''}`}>{heading}</a>
                </h1>
                {body && (
                    <main dangerouslySetInnerHTML={{ __html: body }}></main>
                )}
            </div>
        </div>
    )
}
