import Config from './config'

type LoggedObject = { [K in string]: unknown } & { query?: string }

export default class Logger {
    private readonly bus = console

    verbose(method: string, obj?: LoggedObject) {
        if (['DEBUG', 'VERBOSE', 'TRACE'].includes(Config.loggingLevel)) {
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
                          .split('\n')
                          .join('')
                    : ''
            )
        }
    }

    info(method: string, obj?: Record<string, unknown>) {
        this.bus.log(
            ` DB.${method}`,
            obj ? JSON.stringify(obj, null, 2).split('\n').join('') : ''
        )
    }

    error(method: string, error: Error) {
        this.bus.error(` DB.${method}`, error)
    }
}
