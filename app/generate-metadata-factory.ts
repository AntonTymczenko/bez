import type { Metadata } from 'next'
import { db } from '~src/db'
import type { PageParams } from '~src/types'

const Factory = (prefix?: string) => {
    if (prefix !== undefined && !prefix.startsWith('/')) {
        throw new Error(
            'Prefix for GenerateMetadataFactory should start with "/"'
        )
    }
    return async function generateMetadata(
        props: PageParams
    ): Promise<Metadata> {
        const params = await props.params
        const { lang } = params

        const path = params.path
            ? `${prefix ? `${prefix}` : ''}/${params.path}`
            : '/'
        const heading = await db.getPageTitle(path, lang)

        if (!heading) {
            return {}
        }

        return {
            title: heading,
            description: heading,
        }
    }
}

export default Factory
