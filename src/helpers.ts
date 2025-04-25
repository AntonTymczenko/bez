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

export function parseDescription(markdown: string): string | null {
    // first paragraph after the H1 is the description
    const matched = markdown.match(/^# .+\n+([\s\S]+?)(?=\n+|^#|$)/m)

    return matched?.[1] ?? null
}
