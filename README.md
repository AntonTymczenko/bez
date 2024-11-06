# Food blog platform

Blog with pages and articles. Just like the Wordpress, but built with Next

## Production start
Run `npm run build && npm start`

## Local setup
* `yarn`
* `yarn dev`

## Importing pages and recipes to DB

- Put `*.md` file and matching `*.jpg/jpeg` file into `/content` folder
- MD file should be named like `Name of the page EN.md` (having the locale code at the end)
- Image should match the page, but no language code: `Name of the page.jpg`
- Supported image extensions: `jpg`, `jpeg`
- Run `yarn page`.
- Select article's name from interactive prompt. The image file should be automatically recognized


## Planning
* [ ] make sure the titles of pages are set according to the H1 of the page
* [ ] VERBOSE env var and any other vars should be passed as a config object