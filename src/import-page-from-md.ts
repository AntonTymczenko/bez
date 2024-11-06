import * as fs from 'fs'
import * as path from 'path'
import inquirer from 'inquirer'
import {
    getPermalinkFromFilename,
    readTextFile,
    recognizeHeading,
} from './md-to-html'
import i18n, { type Locale } from '../app/i18n'

const contentDir = '../content'

type File = {
    path: string
    name: string
    permalink: string
    language?: Locale
}
type MdFile = File & { language: Locale }

const prompt = inquirer.createPromptModule()

// Function to get all markdown and image files
const getFiles = (dir: string) => {
    const folder = path.resolve(__dirname, dir)
    const files: string[] = fs.readdirSync(folder)
    const mdFiles: File[] = []
    const jpgFiles: File[] = []

    files.forEach((file) => {
        const filePath = path.join(folder, file)

        if (fs.statSync(filePath).isFile()) {
            let whereToPush: File[] | null = null

            if (file.match(/\.md$/i)) {
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
    imageFile: Omit<File, 'language'> | null
): Promise<any> {
    // TODO: type of return
    if (!imageFile) {
        console.log(`No matching image found for ${mdFile.name}`)
    }

    const markdownContent = readTextFile(mdFile.path)
    const heading = recognizeHeading(markdownContent)

    const importOptions = [
        {
            name: 'Blog page',
            prefix: '',
        },
        {
            name: 'Recipe',
            prefix: 'recipe',
        },
    ]
    const { importAs } = await prompt([
        {
            type: 'list',
            name: 'importAs',
            message: 'How to import this page?',
            choices: importOptions.map((option) => ({
                name: option.name,
                value: option,
            })),
        },
    ])

    const permalink = path.join('/', importAs.prefix, mdFile.permalink)
    const imgExtension = imageFile ? path.extname(imageFile.path) : null
    const imgPermalink = imageFile
        ? `${imageFile.permalink}${imgExtension}`
        : null

    // TODO: aquire from DB
    const pageAlreadyStored = false
    const imageAlreadyStored = false

    const result = {
        importAs: importAs.name,
        language: mdFile.language ?? null,
        heading,
        permalink,
        pageAlreadyStored,
        markdown: markdownContent,
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

// Main function to run the script
const main = async () => {
    console.log('import page from MD script start')
    const { mdFiles, jpgFiles } = getFiles(contentDir)

    if (mdFiles.length === 0) {
        console.log('No markdown files found in the content folder.')
        return
    }

    // Prompt the user to select a markdown file
    const answer = await prompt([
        {
            type: 'list',
            name: 'selectedMdFile',
            message: 'Select a markdown file:',
            choices: mdFiles.map((file) => ({ name: file.name, value: file })),
        },
    ])

    const selectedMdFile = answer.selectedMdFile as MdFile

    // Find the matching image file
    const imageFile = findImageFileForMd(selectedMdFile.path, jpgFiles)

    const result = await confirm(selectedMdFile, imageFile)
    console.log(result ? 'Confirmed' : 'Cancelled')
}

// Run the script
main().catch((error) => console.error('Error:', error))
