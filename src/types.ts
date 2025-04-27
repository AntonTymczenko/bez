// extend this list as needed and provide a proper flag to each item
export const supportedLocales = {
    pl: '🇵🇱',
    uk: '🇺🇦',
    en: '🇺🇲',
} as const
export type Locale = keyof typeof supportedLocales

export type PageContent = {
    heading: string // plain text that is used as a page title and H1
    markdown: string // markdown, whole page but without H1
    imageId: number | null // foreign key
}

export type PageListed = {
    url: string
    heading: PageContent['heading']
    description?: string
    imageId: NonNullable<PageContent['imageId']>
}

export type ContentType = Record<string, Record<Locale, PageContent>>

export type CollectionBaseType = {
    id: number
}

export type ChildrenProps = {
    children: React.ReactNode
}

export type PageParamsLang = {
    params: Promise<{ lang: Locale }>
}

export type PageParams = {
    params: Promise<{ lang: Locale; path: string }>
}

export type LoggerLevel =
    | 'FATAL'
    | 'ERROR'
    | 'WARN'
    | 'INFO'
    | 'DEBUG'
    | 'VERBOSE'
    | 'TRACE'

export type DatabaseOptions = {
    dbPath: string
    loggerLevel: LoggerLevel
}
