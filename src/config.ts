import path from 'path'
import fs from 'fs'
import { Locale, LoggingLevel } from './types'

// first item is the default locale
export const locales = ['pl', 'uk', 'en'] satisfies Locale[]

export const loggingLevel: LoggingLevel = 'DEBUG'

export class database {
    private static FOLDER = './sqlite-data'
    private static MAIN_DB_FILE = 'database.db'

    private static get folder() {
        fs.mkdirSync(this.FOLDER, { recursive: true })
        return path.resolve(this.FOLDER)
    }
    static get path() {
        return path.join(this.folder, this.MAIN_DB_FILE)
    }
}
