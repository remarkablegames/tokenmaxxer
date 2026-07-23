<p align="center">
  <img src="public/logo.svg" width="150" alt="Tokenmaxxer">
</p>

# Tokenmaxxer

[![build](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/build.yml)
[![test](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/test.yml/badge.svg)](https://github.com/remarkablegames/tokenmaxxer/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/remarkablegames/tokenmaxxer/graph/badge.svg?token=suLFjcegVB)](https://codecov.io/gh/remarkablegames/tokenmaxxer)

🏆 An incremental game where you optimize token production to chase the ultimate high score.

> _Climb the corporate AI leaderboard—one token at a time._

Click the Token Reactor, automate production, deploy increasingly questionable AI models, and chase ever-larger High Scores. Every record earns a Performance Bonus, while Ops Comms delivers encouragement, office gossip, and absolutely trustworthy updates from management.

## Play

Play the game on:

- [itch.io](https://remarkablegames.itch.io/tokenmaxxer)
- [Wavedash](https://wavedash.com/games/tokenmaxxer)
- [remarkablegames](https://remarkablegames.org/tokenmaxxer/)

Read the [blog post](https://remarkablegames.org/posts/tokenmaxxer/).

## Features

- Click and automate your way from a workstation to a Cosmic Token Reactor
- Purchase manual, automation, and efficiency upgrades
- Activate Token Surge and Hyperfocus abilities
- Unlock satirical AI models and workplace lore
- Earn milestones and achievements
- Start new sessions for a permanent Token Multiplier
- Export and import local save data
- Continue progressing beyond the main run
- Enjoy background music and sound effects

Your first session takes roughly 15–20 minutes to reach the reset milestone, but the leaderboard never truly ends.

## Controls

- Click or tap the reactor to generate tokens
- Select upgrades to purchase them
- Use ×1, ×10, or MAX purchasing modes
- Audio begins after your first interaction

Progress saves automatically in your browser. No account or internet connection is required after the game loads.

**Can you outperform your colleague—or will the Token Reactor outperform you?**

## Credits

- [DavidKBD - Code Injection Dark Techno Music Pack](https://davidkbd.itch.io/code-injection-dark-techno-music-pack)
- [Pixel Combat by Helton Yan & Beto Bezerra](https://heltonyan.itch.io/pixelcombat)

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
