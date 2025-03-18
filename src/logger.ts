import { loggingLevel } from './config'

export default class Logger {
    verbose(method: string, obj?: Record<string, any>) {
        if (['DEBUG', 'VERBOSE', 'TRACE'].includes(loggingLevel)) {
            console.log(
                ` DB.${method}`,
                obj ? JSON.stringify(obj, null, 2).split('\n').join('') : ''
            )
        }
    }

    info(method: string, obj?: Record<string, any>) {
        console.log(
            ` DB.${method}`,
            obj ? JSON.stringify(obj, null, 2).split('\n').join('') : ''
        )
    }

    error(method: string, error: Error) {
        console.error(` DB.${method}`, error)
    }
}
