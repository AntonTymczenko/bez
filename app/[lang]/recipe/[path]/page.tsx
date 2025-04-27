import Image from 'next/image'
import { notFound } from 'next/navigation'
import GenerateMetadataFactory from '~app/generate-metadata-factory'
import HeaderNavigationContainer from '~src/components/header-navigation-container'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageParams } from '~src/types'
import styles from './style.module.scss'

export const generateMetadata = GenerateMetadataFactory('/recipe')

export default async function PageWithLocale(props: PageParams) {
    const { lang, path } = await props.params
    const dbPath = `/recipe/${path}`
    const content = await db.getPage(dbPath, lang)
    if (!content) {
        return notFound()
    }
    const { heading, markdown, imageId } = content

    const fullPath = `/${lang}/recipe/${path}`

    return (
        <>
            <HeaderNavigationContainer
                {...{
                    path: fullPath,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <article className={styles.recipe}>
                {imageId && (
                    <div className={styles.imageContainer}>
                        <Image
                            src={`/img/${imageId}`}
                            alt={heading}
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                )}
                <h1>{heading}</h1>
                <Markdown lang={lang} markdown={markdown} />
            </article>
        </>
    )
}
