import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import HomePageContent from '~src/components/home-page-content'
import type { PageParams } from '~src/types'

import ArticlePageConent from '~src/components/article-page-content'
import Database from '~src/db'

const db = new Database()

export default async function PageWithLocale(props: PageParams) {
    const params = await props.params
    const { lang } = params

    const path = params.path ? `/${params.path}` : '/'

    const content = await db.getPage(path, lang)
    if (!content) {
        return notFound()
    }
    const { heading, body } = content

    return path === '/' ? (
        <HomePageContent
            {...{
                heading,
                body,
                lang,
                imageId: null,
            }}
        />
    ) : (
        <ArticlePageConent
            {...{
                params: props.params,
                heading,
                body,
                imageId: null,
            }}
        />
    )
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
    const { lang, path } = await props.params
    const heading = await db.getPageTitle(path ? `/${path}` : '/', lang)
    if (!heading) {
        return {}
    }

    return {
        title: heading,
        description: heading,
    }
}
