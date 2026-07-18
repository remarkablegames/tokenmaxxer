# Tokenmaxxer

[![build](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/build.yml)
[![test](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/test.yml/badge.svg)](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/remarkablegames/tokenmaxxer/graph/badge.svg?token=suLFjcegVB)](https://codecov.io/gh/remarkablegames/tokenmaxxer)

🏆 An incremental game where you optimize token production to chase the ultimate high score.

## Install

Clone the repository:

```sh
git clone https://github.com/remarkablegames/tokenmaxxer.git
cd tokenmaxxer
```

Install the dependencies:

```sh
npm install
```

## Run

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the game in the development mode.

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) to view it in the browser.

The page will reload if you make edits.

You will also see any errors in the console.

### `npm run build`

Builds the game for production to the `dist` folder.

It correctly bundles in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your game is ready to be deployed!

### `npm run lint`

Checks code quality.

### `npm run lint:tsc`

Checks for type errors.

### `npm test`

Runs tests.

## Testing

Query previews run in a temporary sandbox. They never overwrite the saved game, and removing the query restores the existing save.

Preview the High Score celebration:

```
http://localhost:5173/?preview=high-score
```

Preview a ready-to-confirm prestige or set a temporary token balance:

```
http://localhost:5173/?preview=prestige
```

```
http://localhost:5173/?tokens=100000000
```

```
http://localhost:5173/?preview=prestige&tokens=250000000
```

## License

[MIT](LICENSE)
