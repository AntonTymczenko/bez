import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import React from 'react'
import { db } from '~src/db'
import type { Locale } from '~src/types'
import PagesList from './pages-list'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)
const placeholderRegex = /({{[\w\d]+}})/g

type TemplateRenderer = (lang: Locale) => Promise<React.JSX.Element>

const templateMap: Record<string, TemplateRenderer> = {
    '{{ArticlesList}}': async (lang) => {
        const articles = await db.getArticles(lang)
        return <PagesList list={articles} />
    },
    '{{RecipesList}}': async (lang) => {
        const recipes = await db.getRecipes(lang)
        return <PagesList list={recipes} />
    },
}

type MarkdownProps = {
    lang: Locale
    markdown: string
}

export default async function Markdown(props: MarkdownProps) {
    const { markdown, lang } = props
    const parts = markdown
        .replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
        .split(placeholderRegex)

    return (
        <div>
            {parts.map(async (part, i) => {
                const trimmed = part.trim()
                if (templateMap[trimmed]) {
                    const element = await templateMap[trimmed](lang)
                    return <React.Fragment key={i}>{element}</React.Fragment>
                }

                const html = await marked.parse(part)
                const safeHtml = DOMPurify.sanitize(html)

                const body = safeHtml.replace(/<h1>.*<\/h1>\n/m, '')

                return (
                    <div key={i} dangerouslySetInnerHTML={{ __html: body }} />
                )
            })}
        </div>
    )
}
