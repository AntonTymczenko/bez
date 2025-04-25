# Food blog platform

Blog with pages and articles. Just like the Wordpress, but built with Next

## Production start

Run `npm run build && npm start`

## Local setup

1. `yarn`
2. `yarn admin --auto` -- seed the DB with content (including the home page)
3. `yarn dev` -- start up the server

## CLI commands

- [`yarn admin`](#content-administration)
- [`yarn backup`](#backing-up-the-database)

### Content administration

#### Importing pages and recipes to the DB

- Put `*.md` files and matching `*.jpg/jpeg` files into `/content` folder
- `/content/page` is for pages, `/content/recipe` is for recipes
- In the Pages folder, `home.md` will be used as the `<DOMAIN>/` link.
  i.e., special word `home` will be replaced with an empty string
- In the Recipes folder, MD files should be named like `Recipe name EN.md`
  (having the locale code at the end)
- Image should match the page's file name, but do not inclue the language code:
  `Recipe name.jpg`
- Supported image extensions: `jpg`, `jpeg`
- Run `yarn admin` and manually select article's and page's name from interactive prompt.
  The image file should be automatically recognized.
- Or run `yarn admin --auto` to autoselect all items from the `/content` folder and import them.

#### Removing pages from the DB

- Run `yarn admin --remove` to manually select items and remove them from the DB

### Backing up the database

- Database is stored in `/sqlite-data/database.db`
- `yarn backup` creates a file `/sqlite-data/database-YYYY-MM-DD_HH-mm-ss.db`

## TODO

- [x] make sure the titles of pages are set according to the H1 of the page
- [x] recognize 2 types of MD file (page, recipe) automatically
- [x] fix Home page. Translate names of the sections
- [x] `yarn admin` command
    - [x] store confirmed page and its image to the DB. Re-use the same image across all locales
    - [x] in autoMode do not show the data that needs to be confirmed in manual mode
    - [x] check if that permalink is already in the DB and mark with a checkmark
    - [-] group all recipe's languages as one item to select
    - [x] support delete page/recipe feature
- [x] Create home page layout
- [x] Distinguish first paragraph as a recipe's description
- [ ] DB get - change type according to the attributes
- [ ] Create layout for articles
- [ ] Create layout for recipes
- [ ] On image import, crop and resize
- [ ] Use cache for page titles
- [ ] Use cache for recipe descriptions
- [ ] Use recipe descriptions as meta descriptions in the page's meta
- [ ] Add sufix '...| MAIN SITE TITLE' to titles of all pages
- [ ] move lang selector to the left. show only one. unfold list on click
- [ ] new setup
    - [ ] `yarn admin` command
        - [ ] support importing examples in automode if nothing else is present in the `/content`
        - [ ] support '--cleanup' flag to remove orphaned images
    - [ ] VERBOSE/INFO/DEBUG env var and any other vars should be passed as a config object
    - [ ] Don't use hardcoded values in the Config. read them from the .env file
    - [ ] Script for creating a local .env file. Check presence of the .env on `yarn start` and `yarn dev`
    - [ ] autopopulate the `/public/.well-known`
- [ ] Open fullscreen image on click
- [ ] Macros and calories calculator
- [ ] Portion +/- calculator
