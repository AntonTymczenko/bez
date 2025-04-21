import Link from 'next/link'
import { notFound } from 'next/navigation'
import HeaderNavigation from '~src/components/header-navigation'
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
    const { heading, body, imageId } = content

    const articles = await db.getArticles(lang)
    const recipes = await db.getRecipes(lang)

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
                    {body && (
                        <main dangerouslySetInnerHTML={{ __html: body }}></main>
                    )}
                    {imageId && (
                        <img src={`/img/${imageId}`} width="100" height="100" />
                    )}
                    {!!articles.length && (
                        <>
                            <p>Articles:</p>
                            <ul>
                                {articles.map((article) => (
                                    <li key={article.url}>
                                        <Link href={article.url}>
                                            {article.heading}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {!!recipes.length && (
                        <>
                            <p>Recipes:</p>
                            <ul>
                                {recipes.map((recipe) => (
                                    <li key={recipe.url}>
                                        <Link href={recipe.url}>
                                            {recipe.heading}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
