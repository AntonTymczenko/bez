import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import { slugify } from 'transliteration'
import Config from './config'
import { filePaths } from './constants'
import { db } from './db'
import I18n from './i18n'
import Logger from './logger'
import type { CollectionBaseType, ContentType, Locale } from './types'

type File = {
    path: string
    name: string
    permalink: string
    language?: Locale
}
type MdFile = File & { language: Locale }

type SelectedItem = {
    importAs: 'recipe' | 'page'
    language: Locale
    heading: string
    permalink: string
    pageAlreadyStored: boolean
    markdown: string
    origin: File['path']
    imgPermalink: string | null
    imgImportFromPath: string | null
    imageAlreadyStored: boolean
}

export class ContentAdmin {
    private readonly logger: Logger
    private readonly prompt: ReturnType<typeof inquirer.createPromptModule<{}>>
    private readonly autoMode: boolean

    constructor(auto: boolean) {
        this.autoMode = auto
        this.logger = new Logger('ContentAdmin', auto ? 'INFO' : 'DEBUG')
        this.prompt = inquirer.createPromptModule()
    }

    async populate(): Promise<void> {
        try {
            // 1. Select pages
            const recipes = await this.selectPage('recipe')
            const pages = await this.selectPage('page')

            // 2. Save images
            const imageIds: Map<
                SelectedItem['imgPermalink'],
                CollectionBaseType['id']
            > = new Map()

            for (const page of pages.concat(recipes)) {
                if (
                    page.imgImportFromPath === null ||
                    page.imgPermalink === null
                ) {
                    continue
                }

                const id = await db.insertImage({
                    permalink: page.imgPermalink,
                    path: page.imgImportFromPath,
                })

                imageIds.set(page.imgPermalink, id)
            }

            // 3. Aggregation. Convert to a map permalink->language->content
            const content: ContentType = {}
            pages.concat(recipes).forEach((item) => {
                const key = item.permalink
                const existingId = content[key] ?? {}
                existingId[item.language] = {
                    heading: item.heading,
                    markdown: item.markdown,
                    imageId: imageIds.get(item.imgPermalink) ?? null,
                }
                content[key] = existingId
            })

            // 4. Write pages to the database
            if (Object.entries(content).length) {
                await db.populatePages(content)
            }

            await db.close()
        } catch (error) {
            this.logger.error('main', error)
        }
    }

    async remove(): Promise<void> {
        const { pageType } = await this.prompt([
            {
                type: 'list',
                name: 'pageType',
                message: `Select type:`,
                choices: [
                    {
                        name: 'Articles',
                        value: 'article',
                    },
                    {
                        name: 'Recipes',
                        value: 'recipe',
                    },
                ],
            },
        ])

        let page = 0
        let pages = Infinity
        const limit = 10
        let selected: { id: number; permalink: string }[] = []

        while (pages > page) {
            const res = await db.getPagesOverall(pageType, limit, limit * page)
            page++
            pages = Math.ceil(res.count / limit)

            const { choice } = await this.prompt([
                {
                    type: 'checkbox',
                    pageSize: limit,
                    name: 'choice',
                    message: `Select ${pageType}s (page ${page}/${pages}):`,
                    choices: res.data.map((item) => ({
                        name: JSON.stringify(item),
                        value: item,
                    })),
                },
            ])

            selected.push(...choice)
        }

        if (!selected.length) {
            return
        }

        const confirmed = await this.confirm(
            `Remove these pages?\n${selected.map((i) => JSON.stringify(i)).join('\n')}`
        )

        if (confirmed) {
            await db.removePages(selected.map(({ id }) => id))
        }
    }

    private readTextFile(fullPath: string): string {
        return fs.readFileSync(fullPath, 'utf-8')
    }

    private recognizeHeading(md: string): string {
        const h1 = md.match(/^#\s+(.*)\n/m)

        const heading = h1?.[1]

        if (!heading) {
            throw new Error('Cannot parse H1 heading in the markdown')
        }

        return heading
    }

    private getPermalinkFromFilename(filename: string): string {
        const withoutExt = filename.replace(/\.\w{2-4}$/i, '')

        return slugify(withoutExt)
            .toLowerCase() // Convert to lowercase first
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/-+/g, '-') // Merge multiple dashes
            .replace(/^-|-$/g, '') // Trim leading and trailing dashes
    }

    // Function to get all markdown and image files from a folder
    private getFiles(dir: string) {
        const folder = path.resolve(__dirname, dir)
        const files: string[] = fs.readdirSync(folder)
        const mdFiles: MdFile[] = []
        const jpgFiles: File[] = []

        files.forEach((file) => {
            const filePath = path.join(folder, file)

            if (!fs.statSync(filePath).isFile()) {
                return
            }

            let isMarkdown = false
            let isImage = false

            if (file.match(/(?<!\.?example)\.md$/i)) {
                isMarkdown = true
            } else if (file.match(/\.jpe?g$/i)) {
                isImage = true
            }

            const { bareName, language } =
                this.getBareNameFromFullPath(filePath)

            if (isMarkdown && !language) {
                throw new Error(`Language is not recognized for ${file}`)
            }

            ;(isMarkdown ? mdFiles : isImage ? jpgFiles : null)?.push({
                path: filePath,
                name: file,
                permalink: this.getPermalinkFromFilename(bareName),
                language,
            })
        })

        return { mdFiles, jpgFiles }
    }

    private getBareNameFromFullPath(filePath: string): {
        bareName: string
        language?: Locale
    } {
        const baseName = path.basename(filePath).replace(/\.\w{2,4}$/i, '')

        const { bareName, language } = new I18n(
            Config.locales
        ).extractTrailingLanguageCode(baseName)

        return { bareName, language }
    }

    // Function to find the matching image for the markdown file
    private findImageFileForMd(
        mdFileFullPath: string,
        jpgFiles: File[]
    ): File | null {
        const { bareName } = this.getBareNameFromFullPath(mdFileFullPath)

        const foundImage = jpgFiles.find(({ name }) =>
            name.startsWith(bareName)
        )

        return foundImage ?? null
    }

    private async prepareItem(
        mdFile: MdFile,
        importAs: 'page' | 'recipe',
        imageFile: Omit<File, 'language'> | null
    ): Promise<SelectedItem> {
        if (!imageFile) {
            this.logger.warn(`No matching image found for ${mdFile.name}`)
        }

        const markdownContent = this.readTextFile(mdFile.path)
        const heading = this.recognizeHeading(markdownContent)

        const importAsPrefix = {
            page: '',
            recipe: 'recipe',
        }[importAs]

        // special treatment for home page
        const permaPath =
            importAs === 'page' && mdFile.permalink == 'home'
                ? ''
                : mdFile.permalink

        const permalink = path.join('/', importAsPrefix, permaPath)
        const imgExtension = imageFile ? path.extname(imageFile.path) : null
        const imgPermalink = imageFile
            ? `${imageFile.permalink}${imgExtension}`
            : null

        // TODO: aquire from DB
        const pageAlreadyStored = !!(await db.getPageTitle(
            permalink,
            mdFile.language
        ))
        const imageAlreadyStored = !!(
            await db.getPage(permalink, mdFile.language)
        )?.imageId

        const item: SelectedItem = {
            importAs,
            language: mdFile.language ?? null,
            heading,
            permalink,
            pageAlreadyStored,
            markdown: markdownContent,
            origin: mdFile.path,
            // TODO: img alt will be gotten from the page's heading
            imgPermalink,
            imgImportFromPath: imageFile?.path ?? null,
            imageAlreadyStored,
        }

        return item
    }

    private async selectPage(
        pageType: 'page' | 'recipe'
    ): Promise<SelectedItem[]> {
        const selected: SelectedItem[] = []
        const dir =
            pageType === 'page' ? filePaths.pagesDir : filePaths.recipesDir

        const { mdFiles, jpgFiles } = this.getFiles(dir)

        let unprocessedCount = mdFiles.length
        if (unprocessedCount === 0) {
            this.logger.warn(
                `No markdown files found in the content "${pageType}" folder ${dir}`
            )
            return []
        }

        let done = false

        this.logger.verbose(`selectPage ${JSON.stringify(mdFiles, null, 4)}`)
        while (unprocessedCount && !done) {
            const choices = mdFiles.map((file) => ({
                name: file.name,
                value: file,
            }))

            // Prompt the user to select a markdown file
            const { selectedFiles } = this.autoMode
                ? { selectedFiles: mdFiles }
                : await this.prompt([
                      {
                          type: 'checkbox',
                          name: 'selectedFiles',
                          message: `Select ${pageType}s to import:`,
                          choices,
                      },
                  ])

            const selectedMdFiles = selectedFiles as MdFile[]

            const items = await Promise.all(
                selectedMdFiles.map(
                    async (file) =>
                        await this.prepareItem(
                            file,
                            pageType,
                            this.findImageFileForMd(file.path, jpgFiles)
                        )
                )
            )

            let confirmed = false

            if (this.autoMode) {
                confirmed = true
            } else {
                confirmed = await this.confirm(
                    `${JSON.stringify(items, null, 4)}\nDo you confirm importing these ${pageType}s?`
                )
            }

            if (confirmed) {
                selected.push(...items)
                unprocessedCount -= items.length

                const indexesOfSelected = items.map((item) =>
                    mdFiles.findIndex((file) => file.path === item.origin)
                )
                indexesOfSelected.reverse().forEach((index) => {
                    mdFiles.splice(index, 1)
                })

                done = true
            }
        }

        return selected
    }

    private async confirm(message: string): Promise<boolean> {
        const { ok } = await this.prompt([
            {
                type: 'list',
                name: 'ok',
                message,
                choices: [
                    {
                        name: 'OK',
                        value: true,
                    },
                    {
                        name: 'Cancel',
                        value: false,
                    },
                ],
            },
        ])

        return ok
    }
}
