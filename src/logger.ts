import type { LoggerLevel } from './types'

type LoggedObject = { [K in string]: unknown } & { query?: string }

const VERBOSE_THRESHOLD = new Set<LoggerLevel>(['VERBOSE', 'TRACE'])
const DEBUG_THRESHOLD = new Set<LoggerLevel>(['DEBUG', ...VERBOSE_THRESHOLD])
const INFO_THRESHOLD = new Set<LoggerLevel>(['INFO', ...DEBUG_THRESHOLD])

export default class Logger {
    private readonly bus: typeof console
    private readonly level: LoggerLevel

    constructor(level: LoggerLevel, bus: typeof console = console) {
        this.bus = bus
        this.level = level
    }

    trace(method: string, obj?: LoggedObject) {
        if (this.level === 'TRACE') {
            this.log(method, obj)
        }
    }

    verbose(method: string, obj?: LoggedObject) {
        if (VERBOSE_THRESHOLD.has(this.level)) {
            this.log(method, obj)
        }
    }

    debug(method: string, obj?: LoggedObject) {
        if (DEBUG_THRESHOLD.has(this.level)) {
            this.log(method, obj)
        }
    }

    info(method: string, obj?: Record<string, unknown>) {
        if (INFO_THRESHOLD.has(this.level)) {
            this.log(method, obj)
        }
    }

    error(method: string, error: Error) {
        this.bus.error(` DB.${method}`, error)
    }

    private log(method: string, obj?: LoggedObject) {
        this.bus.log(
            ` DB.${method}`,
            obj
                ? JSON.stringify(
                      Object.fromEntries(
                          Object.entries(obj).map(([key, value]) => [
                              key,
                              key === 'query'
                                  ? (value as string).replace(/\s+/gm, ' ')
                                  : value,
                          ])
                      )
                  )
                : ''
        )
    }
}
