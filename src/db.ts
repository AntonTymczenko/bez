import crypto from 'crypto'
import sqlite3 from 'sqlite3'
import { type Database as DatabaseSqlite, open } from 'sqlite'
import { promises as fs } from 'fs'
import { PageContent, Locale } from '../app/i18n'
import path from 'path'
import { CONTENT } from './content'

type SQLDBType = DatabaseSqlite<sqlite3.Database, sqlite3.Statement>

type CollectionPage = {
    id: number
    path: string
    locale: Locale
    heading: string
    body: string
}
type CollectionUser = {
    id: number
    name: string
}

type CollectionMigration = {
    id: number
    date: string // Store date in ISO 8601 format
    hash: string
}

type CollectionsMap = {
    pages: CollectionPage
    users: CollectionUser
    migrations: CollectionMigration
}

type CollectionName = keyof CollectionsMap

type Collection<Name extends CollectionName> = CollectionsMap[Name]

if (process.env.VERBOSE) {
    sqlite3.verbose()
}

class Database {
    private DB_DIR = './sqlite-data'
    private DB_FILE = path.join(this.DB_DIR, 'database.db')
    private _db: SQLDBType | null = null
    private initializing = false
    private logger = {
        verbose(method: string, obj?: Record<string, any>) {
            if (process.env.VERBOSE) {
                console.log(
                    ` DB.${method}`,
                    obj ? JSON.stringify(obj, null, 2).split('\n').join('') : ''
                )
            }
        },
        info(method: string, obj?: Record<string, any>) {
            console.log(
                ` DB.${method}`,
                obj ? JSON.stringify(obj, null, 2).split('\n').join('') : ''
            )
        },
    }

    private async initDatabase() {
        this.logger.verbose('initDatabase')

        this.initializing = true
        await fs.mkdir(this.DB_DIR, { recursive: true })

        const db = await open({
            filename: this.DB_FILE,
            driver: sqlite3.cached.Database,
        })

        await db.exec(`CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            locale TEXT NOT NULL,
            heading TEXT NOT NULL,
            body TEXT NOT NULL
        )`)

        await db.exec(`CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL,
            alt TEXT NOT NULL,
            permalink TEXT NOT NULL,
            path TEXT NOT NULL,
            FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE
        )`)

        await db.exec(`CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            hash TEXT NOT NULL
        )`)

        this._db = db
        await this.seed(CONTENT)

        this.initializing = false
    }

    private async seed(content: typeof CONTENT) {
        this.logger.verbose('seed', { content })
        const newHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(content))
            .digest('hex')

        if (!this._db) {
            throw new Error('No Database to seed into')
        }

        const db = this._db

        const query = `SELECT * FROM migrations  WHERE hash = "${newHash}" LIMIT 1`
        this.logger.verbose('seed get migration', { query })
        const existingHash = await this._db.run(query)

        if (existingHash?.[0]) {
            this.logger.info(
                `seed. No need to seed. Done at: ${existingHash?.[0].date}\n${existingHash?.[0].hash}`
            )
            return
        }

        const paths = Object.keys(content)
        const pages: [string, Locale, string, string][] = []

        paths.forEach((path) => {
            const locales = Object.keys(content[path]) as Locale[]
            locales.forEach((locale) => {
                const page = content[path][locale]
                pages.push([path, locale, page.heading, page.body])
            })
        })

        await Promise.all(
            pages.map(async (page) => {
                const query = `path = "${page[0]}" AND locale = "${page[1]}"`
                const fullQuery = `SELECT id FROM pages WHERE ${query} LIMIT 1`

                const existingPages = await db.all<Collection<'pages'>[]>(
                    fullQuery
                )

                if (!Array.isArray(existingPages) || !existingPages[0]) {
                    await this.insertPage(...page)
                }
            })
        )

        await this.insertMigration(newHash)
    }

    private async insertPage(
        path: string,
        locale: string,
        heading: string,
        body: string
    ) {
        const db = this._db!

        const res = await db.run(
            `INSERT INTO pages (path, locale, heading, body) VALUES (?, ?, ?, ?)`,

            [path, locale, heading, body]
        )

        return res
    }

    private async insertMigration(hash: string) {
        this.logger.verbose('insertMigration', { hash })
        const db = this._db!

        const template = 'INSERT INTO migrations (hash, date) VALUES (?, ?)'
        const opts = [hash, new Date().toISOString()]
        this.logger.verbose('insertMigration db.run', { template, opts })
        db.run(template, opts)

        this.logger.verbose(
            `insertMigration. Done seeding. Migration hash: ${hash}`
        )
    }

    private get db(): Promise<SQLDBType> {
        this.logger.verbose('db')
        if (this.initializing) {
            this.logger.verbose('db stillInitializing')
            return new Promise<SQLDBType>((resolve) => {
                this.logger.verbose('db Timeout: wait for DB to be ready')
                setTimeout(() => {
                    resolve(this.db)
                }, 10000)
            })
        }

        if (this._db) {
            this.logger.verbose('db not initializing, got DB (this._db)')
            return Promise.resolve(this._db)
        }

        return this.initDatabase().then(() => {
            this.logger.verbose('db after initDatabase')
            return this.db
        })
    }

    private async getOne<Name extends CollectionName>(args: {
        collection: Name
        query: string
    }): Promise<Collection<Name>> {
        this.logger.verbose('getOne', args)
        const { collection, query } = args
        const records = await this.get({ collection, query, limit: 1 })

        return records[0]
    }

    private async get<Name extends CollectionName>(args: {
        collection: Name
        query?: string
        limit?: number
        attributes?: (keyof Collection<Name>)[]
    }): Promise<Collection<Name>[]> {
        this.logger.verbose('get', args)
        const { collection, query, limit, attributes } = args
        const db = await this.db

        const a = attributes ? attributes.join(',') : '*'
        const q = query ? ` WHERE ${query}` : ''
        const lim = limit ? ` LIMIT ${limit}` : ''

        const fullQuery = `SELECT ${a} FROM ${collection}${q}${lim}`

        const results = await db.all<Collection<Name>[]>(fullQuery)
        this.logger.verbose('get', { fullQuery, results })

        return results ?? []
    }

    async getPage(
        path: string,
        languageCode: Locale
    ): Promise<PageContent | null> {
        this.logger.info('getPage', { path, languageCode })
        const page = await this.getOne({
            collection: 'pages',
            query: `path = "${path}" AND locale = "${languageCode}"`,
        })

        if (!page) {
            this.logger.verbose('getPage, no page')
            return null
        }

        const content: PageContent = {
            heading: page.heading,
            body: page.body,
        }

        return content
    }
}

export default new Database()
