import Negotiator, { Headers } from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { Locale, supportedLocales } from '../src/types'
import { pick } from '../src/helpers'
import { locales } from '../src/config'

class i18n {
    locales: Locale[]
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

    getLocale(headers: Headers): Locale {
        const locales = this.locales

        // Use negotiator and intl-localematcher to get best locale
        const languages = new Negotiator({ headers }).languages(locales)
        const locale = match(languages, locales, this.defaultLocale) as Locale

        return locale
    }

    validateLocale(candidate: string): Locale | undefined {
        // @ts-expect-error
        const isValid = this.locales.includes(candidate)

        return isValid ? (candidate as Locale) : undefined
    }
}

const instance = new i18n(locales)

export default instance
