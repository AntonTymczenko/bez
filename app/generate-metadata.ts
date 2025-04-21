import type { Metadata } from 'next'
import { db } from '~src/db'
import type { PageParams } from '~src/types'

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
