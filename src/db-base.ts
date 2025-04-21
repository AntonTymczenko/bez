import { type Database as DatabaseSqlite, open } from 'sqlite'
import sqlite3 from 'sqlite3'
import type { Collection, CollectionName, CollectionsMap } from './db'
import Logger from './logger'
import type { DatabaseOptions } from './types'

type SQLDBType = DatabaseSqlite<sqlite3.Database, sqlite3.Statement>

abstract class DatabaseBase {
    protected databaseFilepath: string
    protected _db: SQLDBType | null = null
    protected initializing = false
    protected logger: Logger
    protected abstract tables: string[]

    constructor(options: DatabaseOptions) {
        this.databaseFilepath = options.dbPath
        this.logger = new Logger(options.loggerLevel)
        if (options.loggerLevel === 'TRACE') {
            sqlite3.verbose()
        }
        this.initDatabase()
    }

    private async initDatabase() {
        this.logger.verbose('initDatabase')

        this.initializing = true

        const db = await open({
            filename: this.databaseFilepath,
            driver: sqlite3.cached.Database,
        })

        for (const instruction of this.tables) {
            if (!instruction.startsWith('CREATE TABLE IF NOT EXISTS')) {
                throw new Error('Invalid initialization instruction')
            }
            await db.exec(instruction)
        }

        this._db = db

        this.initializing = false
    }

    protected get db(): Promise<SQLDBType> {
        if (this.initializing) {
            this.logger.verbose('db stillInitializing')
            return new Promise<SQLDBType>((resolve) => {
                this.logger.verbose('db Timeout: wait for DB to be ready')
                setTimeout(() => {
                    resolve(this.db)
                }, 1000)
            })
        }

        if (this._db) {
            return Promise.resolve(this._db)
        }

        return this.initDatabase().then(() => {
            this.logger.verbose('db after initDatabase')
            return this.db
        })
    }

    protected async getOne<Name extends CollectionName>(args: {
        collection: Name
        query: string
        attributes?: (keyof Collection<Name>)[]
    }): Promise<CollectionsMap[Name] | null> {
        const { collection, query, attributes } = args
        const records = await this.get({
            collection,
            query,
            order: ['id', -1],
            limit: 1,
            attributes: attributes ?? [],
        })

        if (!records[0]) {
            return null
        }
        return records[0]
    }

    protected async get<Name extends CollectionName>(args: {
        collection: Name
        query?: string
        order?: [string, number?]
        limit?: number
        attributes?: (keyof Collection<Name>)[]
    }): Promise<CollectionsMap[Name][]> {
        this.logger.verbose('get', args)
        const { collection, query, order, limit, attributes } = args
        const db = await this.db

        const a = attributes?.length ? attributes.join(',') : '*'
        const q = query ? ` ${query}` : ''
        const o = order
            ? ` ORDER BY ${order[0]} ${order[1] === -1 ? 'DESC' : 'ASC'}`
            : ''
        const lim = limit ? ` LIMIT ${limit}` : ''

        const fullQuery = `SELECT ${a} FROM ${collection}${q}${o}${lim}`

        this.logger.trace('get', {
            query: fullQuery,
        })
        let results: Collection<Name>[] = []
        try {
            results = await db.all<Collection<Name>[]>(fullQuery)
        } catch (e) {
            this.logger.error('get', e)
        }

        return results
    }

    protected async insertOne<Name extends CollectionName>(
        collection: Name,
        object: Omit<Collection<Name>, 'id'>,
        options?: string
    ) {
        this.logger.verbose(`insertOne ${collection}`, object)
        const db = await this.db

        const entries = Object.entries(object)
        const keys = entries.map(([key, _]) => key)
        const values = entries.map(([_, value]) => value)

        const template = Array(values.length).fill('?').join(', ')
        const res = await db.run(
            `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${template})
            ${options ?? ''}`,
            values
        )

        return res
    }

    async close() {
        if (this._db) {
            await this._db.close()
        }
    }
}

export default DatabaseBase
