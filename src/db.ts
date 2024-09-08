import sqlite3 from 'sqlite3'
import { type Database as DatabaseSqlite, open } from 'sqlite'
import { promises as fs } from 'fs'

type SQLDBType = DatabaseSqlite<sqlite3.Database, sqlite3.Statement>

type CollectionPage = {
    id: number
    title: string
    body: string
}
type CollectionUser = {
    id: number
    name: string
}

type CollectionsMap = {
    pages: CollectionPage
    users: CollectionUser
}

type CollectionName = keyof CollectionsMap

type Collection<Name extends CollectionName> = CollectionsMap[Name]

if (process.env.VERBOSE) {
    sqlite3.verbose()
}

class Database {
    private DB_FILE = './sqlite-data/database.db'
    private _db: SQLDBType | null = null
    private initializing = false

    private async initDatabase() {
        this.initializing = true
        await fs.mkdir(this.DB_FILE, { recursive: true })

        const db = await open({
            filename: this.DB_FILE,
            driver: sqlite3.cached.Database,
        })

        await db.exec(`CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL
        )`)

        this._db = db
        this.initializing = false
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
                }, 2000)
            })
        }

        return this.initDatabase().then(() => {
            return this.db
        })
    }

    async get<Name extends CollectionName>(collection: Name) {
        const db = await this.db

        return db.all<Collection<Name>[]>(`SELECT * FROM ${collection}`)
    }
}

const db = new Database()

export default db
