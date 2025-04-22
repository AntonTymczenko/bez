import { ContentAdmin } from '~src/content-administrator'

// Read the CLI options
const args = process.argv.slice(2)

const autoMode = args.some((option) => option.match(/auto$/i))
const remove = args.some((option) => option.match(/remove$/i))

// Run the script
if (remove) {
    new ContentAdmin(false).remove()
} else {
    new ContentAdmin(autoMode).populate()
}
