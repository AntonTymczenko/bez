export function pick(
    object: { [s: string]: unknown } | null,
    ...paths: string[]
) {
    return object == null
        ? {}
        : Object.fromEntries(
              Object.entries(object).filter(([key]) => paths.includes(key))
          )
}
