import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HeaderNavigation from '~src/components/header-navigation'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageParamsLang } from '~src/types'

export { generateMetadata } from '~app/generate-metadata'

export default async function PageWithLocale(props: PageParamsLang) {
    const params = await props.params
    const { lang } = params

    const dbPath = '/'
    const content = await db.getPage(dbPath, lang)
    if (!content) {
        return notFound()
    }
    const { heading, imageId, markdown } = content

    return (
        <>
            <HeaderNavigation
                {...{
                    path: `/${lang}`,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <div className="homepage">
                <div className="container">
                    <h1>
                        <Link href={dbPath}>{heading}</Link>
                    </h1>
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
