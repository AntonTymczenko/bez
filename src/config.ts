import path from 'path'
import fs from 'fs'
import type { Locale, LoggingLevel } from './types'

class database {
    private static readonly FOLDER = './sqlite-data'
    private static readonly MAIN_DB_FILE = 'database.db'

    private static get folder() {
        fs.mkdirSync(this.FOLDER, { recursive: true })
        return path.resolve(this.FOLDER)
    }
    static get path() {
        return path.join(this.folder, this.MAIN_DB_FILE)
    }
}

export default class Config {
    // first item is the default locale
    private static readonly _locales = ['pl', 'uk', 'en'] satisfies Locale[]
    // private static readonly _loggingLevel: LoggingLevel = 'DEBUG' // 'INFO' // DEBUG
    private static readonly _loggingLevel: LoggingLevel = 'INFO'

    static get locales() {
        return this._locales.slice()
    }

    static get loggingLevel() {
        return this._loggingLevel
    }

    static get database() {
        return database
    }
}
