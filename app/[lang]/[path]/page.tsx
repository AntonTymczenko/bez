import { notFound } from 'next/navigation'
import HeaderNavigation from '~src/components/header-navigation'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageContent, PageParams } from '~src/types'

export { generateMetadata } from '~app/generate-metadata'

export default async function ArticlePageConent(
    props: PageContent & PageParams
) {
    const { lang, path } = await props.params

    const dbPath = `/${path}`
    const content = await db.getPage(dbPath, lang)
    if (!content) {
        return notFound()
    }
    const { heading, markdown, imageId } = content
    const fullPath = `/${lang}/${path}`

    return (
        <>
            <HeaderNavigation
                {...{
                    path: fullPath,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <div className="homepage">
                <div className="container">
                    <h1>
                        <a href={fullPath}>{heading}</a>
                    </h1>
                    {imageId && (
                        <img src={`/img/${imageId}`} width="100" height="100" />
                    )}
                    <Markdown lang={lang} markdown={markdown} />
                </div>
            </div>
        </>
    )
}
