import * as fs from 'fs'
import Config from './config'
import DatabaseBase from './db-base'
import type {
    CollectionBaseType,
    ContentType,
    DatabaseOptions,
    Locale,
    PageContent,
    PageList,
} from './types'

type ImageEntry = {
    permalink: string
    path: string
}

type CollectionPage = CollectionBaseType & {
    path: string
    locale: Locale
    heading: string
    body: string
    image_id: number | null
}

type CollectionImage = CollectionBaseType & {
    // TODO: consider not storing the permalink, it is a denormalization ATM
    permalink: string
    data: Buffer
}

type CollectionUser = CollectionBaseType & {
    name: string
}

type CollectionMigration = CollectionBaseType & {
    date: string // Store date in ISO 8601 format
    hash: string
}

export type CollectionsMap = {
    pages: CollectionPage
    images: CollectionImage
    users: CollectionUser
    migrations: CollectionMigration
}

export type CollectionName = keyof CollectionsMap
export type Collection<Name extends CollectionName> = CollectionsMap[Name]

class Database extends DatabaseBase {
    protected tables = [
        `CREATE TABLE IF NOT EXISTS pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL,
                locale TEXT NOT NULL,
                heading TEXT NOT NULL,
                body TEXT NOT NULL,
                image_id INTEGER,
                FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE SET NULL
            )`,
        `CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                permalink TEXT NOT NULL,
                data BLOB NOT NULL
            )`,
        `CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                hash TEXT NOT NULL
            )`,
    ]

    constructor(options: DatabaseOptions) {
        super(options)
    }

    private async insertPage(
        path: string,
        locale: Locale,
        heading: string,
        body: string,
        imageId: number | null
    ) {
        return this.insertOne('pages', {
            path,
            locale,
            heading,
            body,
            image_id: imageId,
        })
    }

    async getPage(
        path: string,
        languageCode: Locale
    ): Promise<PageContent | null> {
        const page = await this.getOne({
            collection: 'pages',
            query: `WHERE id IN (
                    SELECT MAX(id)
                    FROM pages
                    WHERE path = "${path}"
                    AND locale = "${languageCode}"
                    GROUP BY path
                )`,
        })

        this.logger.debug('getPage', { path, languageCode })

        if (!page) {
            this.logger.verbose('getPage: no page')
            return null
        }

        // const body = await markdownToHtml(page.body, languageCode)

        const content: PageContent = {
            heading: page.heading,
            markdown: page.body,
            imageId: page.image_id,
        }

        return content
    }

    async getPageTitle(
        path: string,
        languageCode: Locale
    ): Promise<PageContent['heading'] | null> {
        this.logger.debug('getPageTitle', { path, languageCode })
        const page = await this.getOne({
            collection: 'pages',
            query: `WHERE path = "${path}" AND locale = "${languageCode}"`,
            attributes: ['heading'],
        })

        return page?.heading ?? null
    }

    async getRecipes(languageCode: Locale, limit = 10): Promise<PageList> {
        return this.getPages(languageCode, 'recipe', limit)
    }

    async getArticles(languageCode: Locale, limit = 10): Promise<PageList> {
        return this.getPages(languageCode, 'article', limit)
    }

    async getPages(
        languageCode: Locale,
        type: 'recipe' | 'article',
        limit: number
    ): Promise<(Omit<PageContent, 'markdown'> & { url: string })[]> {
        const isArticle = type === 'article'

        const pages = await this.get({
            collection: 'pages',
            query: `
                WHERE id IN (
                    SELECT MAX(id)
                    FROM pages
                    WHERE path ${isArticle ? 'NOT ' : ''}LIKE "/recipe/%"${isArticle ? ' AND path != "/"' : ''}
                    AND locale = "${languageCode}"
                    GROUP BY path
                )
            `,
            limit,
            order: ['id', -1],
            attributes: ['heading', 'path', 'image_id'],
        })

        const result = pages ?? []

        this.logger.debug('getPages', { languageCode, type, limit, result })

        return result.map((page) => ({
            heading: page.heading,
            url: `${languageCode}${page.path}`,
            imageId: page.image_id,
        }))
    }

    async insertImage(image: ImageEntry): Promise<number> {
        const { path, permalink } = image

        if (!fs.existsSync(path)) {
            throw new Error(`File not found: ${path}`)
        }

        const data = fs.readFileSync(path)

        try {
            const res = await this.insertOne('images', {
                permalink,
                data,
            })

            if (res.lastID === undefined) {
                throw new Error('Insertion result lastID is undefined')
            }

            let id = res.lastID

            if (id === 0) {
                // when lastID is zero - nothing has been inserted, the image is already stored
                const existingImages = await this.get({
                    collection: 'images',
                    query: `WHERE permalink = "${permalink}"`,
                    attributes: ['id'],
                    limit: 1,
                })

                if (!existingImages[0]) {
                    throw new Error(
                        'Expected image to be already stored, but failed to find it by permalink'
                    )
                }

                id = existingImages[0].id
            }

            return id
        } catch (error) {
            this.logger.error('insertImage', error)
            throw new Error(`Failed to insert image ${path}`)
        }
    }

    async getImageData(id: number): Promise<null | Buffer> {
        const image = await this.getOne({
            collection: 'images',
            query: `WHERE id = ${id}`,
        })

        if (!image) {
            return null
        }

        return image.data
    }

    async populatePages(content: ContentType) {
        this.logger.verbose('populatePages', { content })

        this.logger.debug(
            '---------------------------CONTENT to populate -----------------\n',
            content
        )

        if (!this._db) {
            throw new Error('No Database to populate into')
        }

        const db = await this.db

        const paths = Object.keys(content)
        const pages: [string, Locale, string, string, number | null][] = []

        paths.forEach((path) => {
            const locales = Object.keys(content[path]) as Locale[]
            locales.forEach((locale) => {
                const page = content[path][locale]
                pages.push([
                    path,
                    locale,
                    page.heading,
                    page.markdown,
                    page.imageId,
                ])
            })
        })

        await Promise.all(
            pages.map(async (page) => {
                const query = `path = "${page[0]}" AND locale = "${page[1]}"`
                const fullQuery = `SELECT id FROM pages WHERE ${query} LIMIT 1`

                const existingPages =
                    await db.all<Collection<'pages'>[]>(fullQuery)

                if (Array.isArray(existingPages) && existingPages[0]) {
                    this.logger.warn(
                        `New version of page "/${page[1]}${page[0]}" (${page[2]}) has been written`
                    )
                }

                await this.insertPage(...page)
            })
        )
    }
}

export const db = new Database(Config)
