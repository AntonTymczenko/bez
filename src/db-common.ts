import sqlite3 from 'sqlite3'
import { type Database as DatabaseSqlite, open } from 'sqlite'
import * as Config from './config'
import type { Collection, CollectionName, CollectionsMap } from './db'
import Logger from './logger'

type SQLDBType = DatabaseSqlite<sqlite3.Database, sqlite3.Statement>

abstract class DatabaseCommon {
    protected databaseFilepath: string
    protected _db: SQLDBType | null = null
    protected initializing = false
    protected logger: Logger

    constructor() {
        this.databaseFilepath = Config.database.path
        this.logger = new Logger()
        if (Config.loggingLevel === 'TRACE') {
            sqlite3.verbose()
        }
        this.initDatabase()
    }

    protected abstract initDatabase(): Promise<void>

    protected async initDatabaseWrapper(instructions: string[]) {
        this.logger.verbose('initDatabase')

        this.initializing = true

        const db = await open({
            filename: this.databaseFilepath,
            driver: sqlite3.cached.Database,
        })

        for (const instruction of instructions) {
            if (!instruction.startsWith('CREATE TABLE IF NOT EXISTS')) {
                throw new Error('Invalid initialization instruction')
            }
            await db.exec(instruction)
        }

        this._db = db

        this.initializing = false
    }

    protected get db(): Promise<SQLDBType> {
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

    protected async getOne<Name extends CollectionName>(args: {
        collection: Name
        query: string
    }): Promise<CollectionsMap[Name] | null> {
        this.logger.verbose('getOne', args)
        const { collection, query } = args
        const records = await this.get({
            collection,
            query,
            order: ['id', -1],
            limit: 1,
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

        const a = attributes ? attributes.join(',') : '*'
        const q = query ? ` WHERE ${query}` : ''
        const o = order
            ? ` ORDER BY ${order[0]} ${order[1] === -1 ? 'DESC' : 'ASC'}`
            : ''
        const lim = limit ? ` LIMIT ${limit}` : ''

        const fullQuery = `SELECT ${a} FROM ${collection}${q}${o}${lim}`

        const results = await db.all<Collection<Name>[]>(fullQuery)
        this.logger.verbose('get', { fullQuery, results })

        return results ?? []
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

export default DatabaseCommon
