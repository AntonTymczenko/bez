// extend this list as needed and provide a proper flag to each item
export const supportedLocales = {
    pl: '🇵🇱',
    uk: '🇺🇦',
    en: '🇺🇲',
} as const
export type Locale = keyof typeof supportedLocales

export type PageContent = {
    heading: string // plain text that is used as a page title
    markdown: string // markdown, whole page including H1
    imageId: number | null // foreign key
}

export type PageContentFace = Omit<PageContent, 'markdown'> & {
    body: string // HTML based on the markdown, but without H1
}

export type ContentType = Record<string, Record<Locale, PageContent>>

export type LoggingLevel =
    | 'FATAL'
    | 'ERROR'
    | 'WARN'
    | 'INFO'
    | 'DEBUG'
    | 'VERBOSE'
    | 'TRACE'

export type CollectionBaseType = {
    id: number
}
