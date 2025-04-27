import Config from '~src/config'
import { db } from '~src/db'
import I18n from '~src/i18n'
import type { Locale } from '~src/types'
import HeaderNavigation from './header-navigation'

type Flag = string
type Href = string
export type LinksState = [Locale, Flag, Href]
type HeaderNavigationContainerProps = {
    currentLocale: Locale
    path: string
    dbPath: string
}

const locales = new I18n(Config.locales).getLocalesWithFlags()

export default async function HeaderNavigationContainer(
    props: HeaderNavigationContainerProps
) {
    const { currentLocale, path, dbPath } = props

    const pathWithLocale = (locale: Locale) => {
        const segments = path.split('/')
        segments[1] = locale
        return segments.join('/')
    }

    const links = locales.map(
        ([locale, flag]) =>
            [
                locale,
                flag,
                locale === currentLocale ? path : pathWithLocale(locale),
            ] as LinksState
    )

    const validated = await Promise.all(
        links.map(([locale]) =>
            locale === currentLocale
                ? true
                : db
                      .getPageTitle(dbPath, locale)
                      .then((response) => {
                          return response !== null
                      })
                      .catch(() => false)
        )
    )

    if (!validated.every((x) => x === true)) {
        validated.forEach((isValid, index) => {
            if (!isValid) {
                links[index][2] = `/${links[index][0]}` // change URL to home
            }
        })
    }

    return (
        <HeaderNavigation
            {...{
                homeLink: `/${currentLocale}/`,
                links,
            }}
        />
    )
}
