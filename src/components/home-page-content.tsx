import Link from 'next/link'
import Database from '~src/db'
import type { Locale, PageContentFace } from '~src/types'

export default async function HomePageContent(
    props: PageContentFace & { lang: Locale }
) {
    const { heading, body, lang } = props
    const recipes = await new Database().getRecipes(lang)

    return (
        <div className="homepage">
            <div className="container">
                <h1>
                    <Link href="/">{heading}</Link>
                </h1>
                {body && (
                    <main dangerouslySetInnerHTML={{ __html: body }}></main>
                )}
                {!!recipes.length && (
                    <ul>
                        {recipes.map((recipe) => (
                            <li key={recipe.url}>
                                <Link href={recipe.url}>{recipe.heading}</Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
