import * as fs from 'fs'
import * as path from 'path'
import inquirer from 'inquirer'
import {
    getPermalinkFromFilename,
    readTextFile,
    recognizeHeading,
} from './md-to-html'
import i18n from '../app/i18n'
import type { CollectionBaseType, ContentType, Locale } from './types'
import { filePaths } from './constants'
import db from './db'

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

const prompt = inquirer.createPromptModule()

// Function to get all markdown and image files from a folder
const getFiles = (dir: string) => {
    const folder = path.resolve(__dirname, dir)
    const files: string[] = fs.readdirSync(folder)
    const mdFiles: File[] = []
    const jpgFiles: File[] = []

    files.forEach((file) => {
        const filePath = path.join(folder, file)

        if (fs.statSync(filePath).isFile()) {
            let whereToPush: File[] | null = null

            if (file.match(/(?<!\.?example)\.md$/i)) {
                whereToPush = mdFiles
            } else if (file.match(/\.jpe?g$/i)) {
                whereToPush = jpgFiles
            }

            if (whereToPush) {
                const { bareName, language } = getBareNameFromFullPath(filePath)

                whereToPush.push({
                    path: filePath,
                    name: file,
                    permalink: getPermalinkFromFilename(bareName),
                    language,
                })
            }
        }
    })

    return { mdFiles, jpgFiles }
}

function extractTrailingLanguageCode(baseName: string): {
    bareName: string
    language?: Locale
} {
    const locs = i18n.locales.join('|')
    const matcher = new RegExp(`\\s(${locs})$`, 'i')

    const language = baseName.match(matcher)?.[1]?.toLowerCase() as Locale
    const locale = i18n.validateLocale(language)

    const bareName = baseName.replace(matcher, '')

    return {
        language: locale,
        bareName,
    }
}

function getBareNameFromFullPath(filePath: string): {
    bareName: string
    language?: Locale
} {
    const baseName = path.basename(filePath).replace(/\.\w{2,4}$/i, '')

    const { bareName, language } = extractTrailingLanguageCode(baseName)

    return { bareName, language }
}

// Function to find the matching image for the markdown file
const findImageFileForMd = (
    mdFileFullPath: string,
    jpgFiles: File[]
): File | null => {
    const { bareName } = getBareNameFromFullPath(mdFileFullPath)

    const foundImage = jpgFiles.find(({ name }) => name.startsWith(bareName))

    return foundImage ?? null
}

async function confirm(
    mdFile: MdFile,
    importAs: 'page' | 'recipe',
    imageFile: Omit<File, 'language'> | null
): Promise<SelectedItem | null> {
    // TODO: type of return
    if (!imageFile) {
        console.log(`No matching image found for ${mdFile.name}`)
    }

    const markdownContent = readTextFile(mdFile.path)
    const heading = recognizeHeading(markdownContent)

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
    const pageAlreadyStored = false
    const imageAlreadyStored = false

    const result: SelectedItem = {
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

    console.log('Result:', JSON.stringify(result, null, 2))

    // Prompt the user to confirm
    const confirmation = await prompt([
        {
            type: 'list',
            name: 'confirmationValue',
            message: 'Do you confirm importing these values?',
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

    return confirmation.confirmationValue === true ? result : null
}

async function selectPageType(
    pageType: 'page' | 'recipe'
): Promise<SelectedItem[]> {
    const selected: SelectedItem[] = []
    const dir = pageType === 'page' ? filePaths.pagesDir : filePaths.recipesDir

    const { mdFiles, jpgFiles } = getFiles(dir)

    let unprocessedCount = mdFiles.length
    if (unprocessedCount === 0) {
        console.log(
            `No markdown files found in the content "${pageType}" folder ${dir}`
        )
        return []
    }

    let done = false

    console.log(mdFiles)
    while (unprocessedCount && !done) {
        // Prompt the user to select a markdown file
        const answer = await prompt([
            {
                type: 'list',
                name: 'selectedMdFile',
                message: 'Select a markdown file:',
                choices: mdFiles.map((file) => ({
                    name: file.name,
                    value: file,
                })),
            },
        ])

        const selectedMdFile = answer.selectedMdFile as MdFile

        // Find the matching image file
        const imageFile = findImageFileForMd(selectedMdFile.path, jpgFiles)

        const result = await confirm(selectedMdFile, pageType, imageFile)
        if (result) {
            selected.push(result)
            unprocessedCount--

            const indexOfSelected = mdFiles.findIndex(
                (file) => file.path === result.origin
            )
            mdFiles.splice(indexOfSelected, 1)
        }

        const { selectMore } = await prompt([
            {
                type: 'input',
                name: 'selectMore',
                message: 'Select more?',
            },
        ])

        if (!selectMore.match(/^y/i)) {
            done = true
        }
    }

    return selected
}

// Main function to run the script
const main = async (auto = false) => {
    // TODO: use `auto` to autoselect all files in non-interactive mode

    // 1. import recipes
    const recipes = await selectPageType('recipe')

    // 2. import pages
    const pages = await selectPageType('page')

    // 3. convert to a map permalink->language->content
    const content: ContentType = {}

    // Verification
    recipes.forEach((recipe) => {
        if (recipe.language === null) {
            throw new Error(`Locale is not specified for file ${recipe.origin}`)
        }
    })
    pages.forEach((page) => {
        if (page.language === null) {
            throw new Error(`Locale is not specified for file ${page.origin}`)
        }
    })

    // Save images
    const imageIds: Map<
        SelectedItem['imgPermalink'],
        CollectionBaseType['id']
    > = new Map()

    for (const page of pages.concat(recipes)) {
        if (page.imgImportFromPath === null || page.imgPermalink === null) {
            continue
        }

        const id = await db.insertImage({
            permalink: page.imgPermalink,
            path: page.imgImportFromPath,
        })

        imageIds.set(page.imgPermalink, id)
    }

    // Aggregation
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

    if (Object.entries(content).length) {
        await db.populatePages(content)
    }

    await db.close()
}

// Run the script
main().catch((error) => console.error(error))
