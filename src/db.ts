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

    private async initDatabase() {
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

        await db.exec(`CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            hash TEXT NOT NULL
        )`)

        this._db = db
        this.initializing = false

        await this.seed(CONTENT)
    }

    private async seed(content: typeof CONTENT) {
        const newHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(content))
            .digest('hex')

        const existingHash = await this.get({
            collection: 'migrations',
            query: `hash = "${newHash}"`,
            limit: 1,
        })
        if (existingHash?.[0]) {
            console.log(
                `No need to seed. Done at: ${existingHash?.[0].date}\n${existingHash?.[0].hash}`
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
                const existing = await this.getPage(page[0], page[1])
                if (!existing) {
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
        const db = await this.db

        const res = await db.run(
            `INSERT INTO pages (path, locale, heading, body) VALUES (?, ?, ?, ?)`,

            [path, locale, heading, body]
        )

        return res
    }

    private async insertMigration(hash: string) {
        const db = await this.db

        db.run(`INSERT INTO migrations (hash, date) VALUES (?, ?)`, [
            hash,
            new Date().toISOString(),
        ])

        console.log(`Done seeding. Migration hash: ${hash}`)
    }

    private get db(): Promise<SQLDBType> {
        if (this._db) {
            return Promise.resolve(this._db)
        }

        if (this.initializing) {
            return new Promise<SQLDBType>((resolve) => {
                console.log('Timeout: wait for DB to be ready')
                setTimeout(() => {
                    resolve(this.db)
                }, 10000)
            })
        }

        return this.initDatabase().then(() => {
            return this.db
        })
    }

    async getOne<Name extends CollectionName>(args: {
        collection: Name
        query: string
    }): Promise<Collection<Name>> {
        const { collection, query } = args
        const records = await this.get({ collection, query, limit: 1 })

        return records[0]
    }

    async get<Name extends CollectionName>(args: {
        collection: Name
        query?: string
        limit?: number
        attributes?: (keyof Collection<Name>)[]
    }): Promise<Collection<Name>[]> {
        const { collection, query, limit, attributes } = args
        const db = await this.db

        const a = attributes ? attributes.join(',') : '*'
        const q = query ? ` WHERE ${query}` : ''
        const lim = limit ? ` LIMIT ${limit}` : ''

        const fullQuery = `SELECT ${a} FROM ${collection}${q}${lim}`

        const results = await db.all<Collection<Name>[]>(fullQuery)
        // console.dir({ get: fullQuery, results })

        return results ?? []
    }

    async getPage(
        path: string,
        languageCode: Locale
    ): Promise<PageContent | null> {
        const page = await this.getOne({
            collection: 'pages',
            query: `path = "${path}" AND locale = "${languageCode}"`,
        })

        if (!page) {
            console.log('no page at all')
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
