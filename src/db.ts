import fs from 'fs'
import path from 'path'
import type {
    CollectionBaseType,
    ContentType,
    Locale,
    PageContentFace,
} from './types'
import markdownToHtml from './md-to-html'
import DatabaseCommon from './db-common'

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

class Database extends DatabaseCommon {
    constructor() {
        super()
    }

    protected async initDatabase() {
        this.initDatabaseWrapper([
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
        ])
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
    ): Promise<PageContentFace | null> {
        this.logger.info('getPage', { path, languageCode })
        const page = await this.getOne({
            collection: 'pages',
            query: `path = "${path}" AND locale = "${languageCode}"`,
        })

        if (!page) {
            this.logger.verbose('getPage: no page')
            return null
        }

        const body = await markdownToHtml(page.body)

        const content: PageContentFace = {
            heading: page.heading,
            body,
            imageId: page.image_id,
        }

        return content
    }

    async getRecipes(
        languageCode: Locale,
        limit = 10
    ): Promise<(Omit<PageContentFace, 'body'> & { url: string })[]> {
        this.logger.info('getRecipes', { languageCode, limit })
        const pages = await this.get({
            collection: 'pages',
            query: `path LIKE "/recipe/%" AND locale = "${languageCode}"`,
            limit,
            order: ['id', -1],
        })

        return (pages ?? []).map((page) => {
            return {
                heading: page.heading,
                url: `${languageCode}${page.path}`,
                imageId: page.image_id,
            }
        })
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
                    query: `permalink = "${permalink}"`,
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

    async getImageData(permalink: string): Promise<null | Buffer> {
        const image = await this.getOne({
            collection: 'images',
            query: `permalink = "${permalink}"`,
        })

        if (!image) {
            return null
        }

        return image.data
    }

    async populatePages(content: ContentType) {
        this.logger.verbose('populatePages', { content })

        console.log(
            '---------------------------CONTENT to populate -----------------'
        )
        console.log(content)

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

                const existingPages = await db.all<Collection<'pages'>[]>(
                    fullQuery
                )

                if (Array.isArray(existingPages) && existingPages[0]) {
                    this.logger.info(
                        `PopulatePages: Overwriting page "/${page[1]}${page[0]}" (${page[2]})`
                    )
                }

                await this.insertPage(...page)
            })
        )
    }
}

const dbInstance = new Database()

export default dbInstance
