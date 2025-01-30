import db from '../../src/db'
import { LocaleProps } from './propTypes'

export default async function PageWithLocale(props: LocaleProps) {
    const { lang } = props.params
    const content = await db.getPage('/', lang)
    const { heading, body } = content ?? {}

    const recipes = await db.getRecipes(lang)

    return (
        content && (
            <div className="homepage">
                <div className="container">
                    <h1>
                        <a href="/">{heading}</a>
                    </h1>
                    {body && (
                        <main dangerouslySetInnerHTML={{ __html: body }}></main>
                    )}
                    {recipes.length && (
                        <ul>
                            {recipes.map((recipe) => (
                                <li key={recipe.url}>
                                    <a href={recipe.url}>{recipe.heading}</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        )
    )
}
