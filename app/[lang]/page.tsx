import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HeaderNavigation from '~src/components/header-navigation'
import Markdown from '~src/components/markdown'
import { db } from '~src/db'
import type { PageParamsLang } from '~src/types'
import styles from './style.module.scss'

export { generateMetadata } from '~app/generate-metadata'

export default async function PageWithLocale(props: PageParamsLang) {
    const params = await props.params
    const { lang } = params
    const dbPath = '/'

    const recipes = await db.getRecipes(lang, 11)
    const featuredRecipe = recipes[0]
    recipes.splice(0, 1)

    const content = await db.getPage(dbPath, lang)
    if (!content) {
        return notFound()
    }
    const { heading, markdown } = content

    return (
        <>
            <HeaderNavigation
                {...{
                    path: `/${lang}`,
                    currentLocale: lang,
                    dbPath,
                }}
            />
            <div className={styles.container}>
                {featuredRecipe && (
                    <header className={styles.heroSection}>
                        {featuredRecipe.imageId && (
                            <Image
                                src={`/img/${featuredRecipe.imageId}`}
                                alt={featuredRecipe.heading}
                                width={1200}
                                height={500}
                                className={styles.heroImage}
                                priority
                            />
                        )}
                        <Link href={featuredRecipe.url}>
                            <div className={styles.heroText}>
                                <h3>{featuredRecipe.heading}</h3>
                                {featuredRecipe.description && (
                                    <p>{featuredRecipe.description}</p>
                                )}
                            </div>
                        </Link>
                    </header>
                )}
                <main className={styles.gallery}>
                    {!!recipes.length &&
                        recipes.map((recipe) => (
                            <div key={recipe.url} className={styles.card}>
                                <Link href={recipe.url}>
                                    <Image
                                        src={`/img/${recipe.imageId}`}
                                        alt={recipe.heading}
                                        width={400}
                                        height={250}
                                        className={styles.cardImage}
                                    />
                                    <div className={styles.cardContent}>
                                        <h3>{recipe.heading}</h3>
                                        {recipe.description && (
                                            <p>{recipe.description}</p>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ))}
                </main>
            </div>
            <aside className={styles.sidebar}>
                <h1>{heading}</h1>
                <Markdown lang={lang} markdown={markdown} />
            </aside>
        </>
    )
}
