import pick from 'lodash.pick'
import Negotiator, { Headers } from 'negotiator'
import { match } from '@formatjs/intl-localematcher'

const supportedLocales = {
    pl: '🇵🇱',
    uk: '🇺🇦',
    en: '🇺🇲',
} as const

export type Locale = keyof typeof supportedLocales
export type PageContentKey = 'heading' | 'body'
export type PageContent = Record<PageContentKey, string>

class i18n {
    locales: Locale[]
    flags: Partial<typeof supportedLocales>
    defaultLocale: Locale

    constructor(config: Locale[]) {
        const verifiedLocales = config.filter((l) =>
            Object.keys(supportedLocales).includes(l)
        )

        this.locales = Array.from<Locale>(new Set<Locale>(verifiedLocales))
        this.flags = pick(supportedLocales, verifiedLocales)
        this.defaultLocale = this.locales[0]
    }

    getFlag(languageCode: Locale) {
        return this.flags[languageCode] ?? '🏳️'
    }

    getLocale(headers: Headers): Locale {
        const locales = this.locales

        // Use negotiator and intl-localematcher to get best locale
        const languages = new Negotiator({ headers }).languages(locales)
        const locale = match(languages, locales, this.defaultLocale) as Locale

        return locale
    }
}

// TODO: read from environment
const instance = new i18n(['pl', 'uk', 'en'])

export default instance
