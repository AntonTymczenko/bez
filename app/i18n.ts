import { CONTENT } from '../src/content'

export type Locale = 'pl' | 'uk' | 'en'
export type DictionaryKey = 'heading' | 'message' | 'flag'
export type Dictionary = Record<DictionaryKey, string>

const locales = Object.keys(CONTENT) as Locale[]

const getFlag = (languageCode: Locale): Dictionary['flag'] => {
    return CONTENT[languageCode].flag
}

const getContent = (languageCode?: string): Dictionary => {
    const basic = languageCode?.substring(0, 2)
    const recognizedCode = basic && locales.find((c) => c.match(basic))

    const code = recognizedCode ?? i18n.defaultLocale

    const data = CONTENT[code]

    return data
}

const i18n = {
    defaultLocale: 'pl',
    locales,
    getContent,
    getFlag,
} as const

export default i18n
