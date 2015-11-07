# Ionic Gulp Seed
### An ionic starter project with a gulp toolchain

## Structure

The source code lives inside the `app` folder.

| Source Files  | Location |
| ------------- | ------------- |
| Javascript    | `app/scripts`  |
| Styles (scss) | `app/styles`  |
| Templates     | `app/templates`  |
| Images        | `app/images`  |
| Fonts         | `app/fonts`  |
| Icons         | `app/icons`  |

A lot of starter kits and tutorials encourage you to work directly inside the `www` folder, but I chose `app` instead, as it conforms better with most Angular.js projects. Note that `www` is gitignored and will be created dynamically during our build process.

## Workflow

This doc assumes you have `gulp` globally installed (`npm install -g gulp`).
If you do not have / want gulp globally installed, you can run `npm run gulp` instead.

#### Development mode

By running just `gulp`, we start our development build process, consisting of:

- compiling, concatenating, auto-prefixing of all `.scss` files required by `app/styles/main.scss`
- creating `vendor.js` file from external sources defined in `./vendor.json`
- automatically inject sources into `index.html` so we don't have to add / remove sources manually
- build everything into `.www-dev` folder (also gitignored)
- start local development server and serve from `.www-dev`
- start watchers to automatically lint javascript source files, compile scss and reload browser on changes

#### Build mode

By running just `gulp --build` or short `gulp -b`, we start gulp in build mode

- concat all `.js` sources into single `app.js` file
- version `main.css` and `app.js`
- build everything into `www` folder

#### Run

By running `gulp -r <platform>`, we can run our app on a connected device

- <platform> can be either `ios` or `android`, defaults to `ios`
- It will run the `gulp --build` before, so we have a fresh version to test
