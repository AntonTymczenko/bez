import Image from 'next/image'
import { notFound } from 'next/navigation'
import GenerateMetadataFactory from '~app/generate-metadata-factory'
import HeaderNavigationContainer from '~src/components/header-navigation-container'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageContent, PageParams } from '~src/types'

export const generateMetadata = GenerateMetadataFactory()

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
            <HeaderNavigationContainer
                {...{
                    path: fullPath,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <div className="homepage">
                <div className="container">
                    <h1>{heading}</h1>
                    {imageId && (
                        <Image
                            src={`/img/${imageId}`}
                            width="100"
                            height="100"
                            alt={heading}
                        />
                    )}
                    <Markdown lang={lang} markdown={markdown} />
                </div>
            </div>
        </>
    )
}
