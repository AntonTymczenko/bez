import i18n from '../../../i18n'
import { LocaleProps } from '../../propTypes'

type Props = LocaleProps & {
    params: { id: string }
}

export default function PageWithLocale(props: Props) {
    const { lang, id } = props.params
    const dictionary = i18n.getDictionary(lang)

    const { dish, recipe } = dictionary

    return (
        <>
            <div className="container">
                <h1>
                    <a href={`/recipe/${id}`}>{dish}</a>
                </h1>
                <p>{`ID ${id}`}</p>
                <p>{recipe}</p>
            </div>
        </>
    )
}
