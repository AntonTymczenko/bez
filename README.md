# Food blog platform

Blog with pages and articles. Just like the Wordpress, but built with Next

## Production start

Run `npm run build && npm start`

## Local setup

1. `yarn`
2. `yarn page` -- seed the DB with content (including the home page)
3. `yarn dev` -- start up the server

## CLI commands

- [`yarn page`](#importing-pages-and-recipes-to-db)
- [`yarn backup`](#backing-up-the-database)

### Importing pages and recipes to DB

- Put `*.md` files and matching `*.jpg/jpeg` files into `/content` folder
- `/content/page` is for pages, `/content/recipe` is for recipes
- In the Pages folder, `home.md` will be used as the `<DOMAIN>/` link.
  i.e., special word `home` will be replaced with an empty string
- In the Recipes folder, MD files should be named like `Recipe name EN.md`
  (having the locale code at the end)
- Image should match the page's file name, but do not inclue the language code:
  `Recipe name.jpg`
- Supported image extensions: `jpg`, `jpeg`
- Run `yarn page`.
- Select article's name from interactive prompt. The image file should be automatically recognized

### Backing up the database

- Database is stored in `/sqlite-data/database.db`
- `yarn backup` creates a file `/sqlite-data/database-YYYY-MM-DD_HH-mm-ss.db`

## Planning

- [x] make sure the titles of pages are set according to the H1 of the page
- [x] recognize 2 types of MD file (page, recipe) automatically
- [ ] yarn page
    - [ ] check if that permalink is already in the DB and mark with a checkmark
    - [ ] group all recipe's languages as one item to select
    - [ ] store confirmed page and its image to the DB. Re-use the same image across all locales
- [ ] add sufix '...| MAIN SITE TITLE' to titles of all pages
- [ ] VERBOSE env var and any other vars should be passed as a config object
