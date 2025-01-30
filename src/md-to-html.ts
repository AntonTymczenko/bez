import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import fs from 'fs'
import { slugify } from 'transliteration'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

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

/**
 *
 * @param markdown
 * @returns HTML body without H1
 */
export default async function markdownToHtml(
    markdown: string = ''
): Promise<string> {
    const html = await marked.parse(
        markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
    )
    const clean = DOMPurify.sanitize(html)

    const body = clean.replace(/<h1>.*<\/h1>\n/m, '')

    return body
}
