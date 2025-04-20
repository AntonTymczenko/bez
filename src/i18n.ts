import Negotiator, { type Headers } from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { type Locale, supportedLocales } from '~src/types'
import { pick } from '~src/helpers'

export default class I18n {
    private locales: Locale[]
    flags: Partial<typeof supportedLocales>
    defaultLocale: Locale

    constructor(config: Locale[]) {
        const verifiedLocales = config.filter((l) =>
            Object.keys(supportedLocales).includes(l)
        )

        this.locales = Array.from<Locale>(new Set<Locale>(verifiedLocales))
        this.flags = pick(supportedLocales, ...verifiedLocales)
        this.defaultLocale = this.locales[0]
    }

    getFlag(languageCode: Locale) {
        return this.flags[languageCode] ?? '🏳️'
    }

    getLocalesWithFlags(): [Locale, string][] {
        return this.locales.map((locale) => [locale, this.getFlag(locale)])
    }

    getLocale(headers: Headers): Locale {
        const locales = this.locales

        // Use negotiator and intl-localematcher to get best locale
        const languages = new Negotiator({ headers }).languages(locales)
        const locale = match(languages, locales, this.defaultLocale) as Locale

        return locale
    }

    validateLocale(candidate: string): Locale | undefined {
        const isValid = this.locales.includes(candidate as Locale)

        return isValid ? (candidate as Locale) : undefined
    }

    localeRecognizedInPath(pathname: string): boolean {
        return this.locales.some(
            (locale) =>
                pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
        )
    }

    extractTrailingLanguageCode(baseName: string): {
        bareName: string
        language?: Locale
    } {
        const locs = this.locales.join('|')
        const matcher = new RegExp(`\\s(${locs})$`, 'i')

        const language = baseName.match(matcher)?.[1]?.toLowerCase() as Locale
        const locale = this.validateLocale(language)

        const bareName = baseName.replace(matcher, '')

        return {
            language: locale,
            bareName,
        }
    }
}
