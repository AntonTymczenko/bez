import fs from 'fs'
import { slugify } from 'transliteration'

export const readTextFile = (fullPath: string): string => {
    return fs.readFileSync(fullPath, 'utf-8')
}

// TODO: get fallback title equal to home page's title (`/` page URL)
const fallbackTitle = 'Bez cukru, bez glutenu'

export function recognizeHeading(md: string): string {
    const h1 = md.match(/^#\s+(.*)\n/m)

    return h1?.[1] ?? fallbackTitle
}

export function getPermalinkFromFilename(filename: string): string {
    const withoutExt = filename.replace(/\.\w{2-4}$/i, '')

    return slugify(withoutExt)
        .toLowerCase() // Convert to lowercase first
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-') // Merge multiple dashes
        .replace(/^-|-$/g, '') // Trim leading and trailing dashes
}
