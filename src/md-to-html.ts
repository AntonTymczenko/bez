import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import path from 'path'
import fs from 'fs'
import { slugify } from 'transliteration'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

export const readTextFile = (fullPath: string): string => {
    return fs.readFileSync(fullPath, 'utf-8')
}

const mdDefault: string = readTextFile(
    path.resolve(__dirname, '../content/recipe.md.example')
)

// TODO: get fallback title equal to home page title
const fallbackTitle = 'Bez cukru, bez glutenu'

function extractTitle(html: string): string {
    return html.match(/<h1>(.+)<\/h1>/m)?.[1] ?? fallbackTitle
}

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

export default async function markdownToHtml(
    source: string = mdDefault
): Promise<{
    heading: string
    body: string
}> {
    const html = await marked.parse(
        source.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
    )
    const clean = DOMPurify.sanitize(html)

    // const heading = extractTitle(clean)
    const heading = recognizeHeading(source)
    const body = clean.replace(/<h1>.*<\/h1>\n/m, '')

    return {
        heading,
        body,
    }
}
