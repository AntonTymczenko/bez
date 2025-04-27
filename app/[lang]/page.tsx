import HeaderNavigationContainer from '~src/components/header-navigation-container'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageParamsLang } from '~src/types'
import styles from './style.module.scss'

import GenerateMetadataFactory from '~app/generate-metadata-factory'
import { Carousel } from '~src/components/carousel'
export const generateMetadata = GenerateMetadataFactory()

export default async function HomePage(props: PageParamsLang) {
    const { lang } = await props.params
    const dbPath = '/'

    const recipes = await db.getRecipes(lang, 6)
    const { markdown } = (await db.getPage(dbPath, lang)) ?? {}

    return (
        <>
            <HeaderNavigationContainer
                {...{
                    path: `/${lang}`,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <Carousel
                slides={recipes.map((recipe) => ({
                    url: recipe.url,
                    imageUrl: `/img/${recipe.imageId}`,
                    title: recipe.heading,
                    description: recipe.description,
                }))}
            />
            <main className="content">
                {!!markdown && (
                    <div className={styles.sidebar}>
                        <Markdown lang={lang} markdown={markdown} />
                    </div>
                )}
            </main>
        </>
    )
}
