import * as fs from 'fs'
import inquirer from 'inquirer'
import * as path from 'path'
import Config from './config'
import { filePaths } from './constants'
import { db } from './db'
import I18n from './i18n'
import {
    getPermalinkFromFilename,
    readTextFile,
    recognizeHeading,
} from './md-to-html'
import type { CollectionBaseType, ContentType, Locale } from './types'

const logger = console

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

function getBareNameFromFullPath(filePath: string): {
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
const findImageFileForMd = (
    mdFileFullPath: string,
    jpgFiles: File[]
): File | null => {
    const { bareName } = getBareNameFromFullPath(mdFileFullPath)

    const foundImage = jpgFiles.find(({ name }) => name.startsWith(bareName))

    return foundImage ?? null
}

function prepareItem(
    mdFile: MdFile,
    importAs: 'page' | 'recipe',
    imageFile: Omit<File, 'language'> | null
): SelectedItem {
    // TODO: type of return
    if (!imageFile) {
        logger.warn(`No matching image found for ${mdFile.name}`)
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

async function confirm(
    ...args: Parameters<typeof prepareItem>
): Promise<ReturnType<typeof prepareItem> | null> {
    const item = prepareItem(...args)

    // Prompt the user to confirm
    logger.info('Result:', JSON.stringify(item, null, 2))
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

    return confirmation.confirmationValue === true ? item : null
}

async function selectPageType(
    pageType: 'page' | 'recipe',
    autoMode: boolean
): Promise<SelectedItem[]> {
    const selected: SelectedItem[] = []
    const dir = pageType === 'page' ? filePaths.pagesDir : filePaths.recipesDir

    const { mdFiles, jpgFiles } = getFiles(dir)

    let unprocessedCount = mdFiles.length
    if (unprocessedCount === 0) {
        logger.warn(
            `No markdown files found in the content "${pageType}" folder ${dir}`
        )
        return []
    }

    let done = false

    logger.info(mdFiles)
    while (unprocessedCount && !done) {
        const choices = mdFiles.map((file) => ({
            name: file.name,
            value: file,
        }))

        // Prompt the user to select a markdown file
        const answer = autoMode
            ? { selectedMdFile: choices[0].value }
            : await prompt([
                  {
                      type: 'list',
                      name: 'selectedMdFile',
                      message: 'Select a markdown file:',
                      choices,
                  },
              ])

        const selectedMdFile = answer.selectedMdFile as MdFile

        // Find the matching image file
        logger.info({ selectedMdFile, path: selectedMdFile.path, jpgFiles })
        const imageFile = findImageFileForMd(selectedMdFile.path, jpgFiles)

        const result = autoMode
            ? prepareItem(selectedMdFile, pageType, imageFile)
            : await confirm(selectedMdFile, pageType, imageFile)

        if (result) {
            selected.push(result)
            unprocessedCount--

            const indexOfSelected = mdFiles.findIndex(
                (file) => file.path === result.origin
            )
            mdFiles.splice(indexOfSelected, 1)
        }

        const { selectMore } = autoMode
            ? { selectMore: 'yes' }
            : await prompt([
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
const main = async (auto: boolean) => {
    // TODO: use `auto` to autoselect all files in non-interactive mode

    // 1. import recipes
    const recipes = await selectPageType('recipe', auto)

    // 2. import pages
    const pages = await selectPageType('page', auto)

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
const autoMode = !!process.argv
    .slice(2)
    .find((option) => option.match(/auto$/i))
main(autoMode).catch((error) => logger.error(error))
