<p align="center">
  <img src="https://user-images.githubusercontent.com/324440/48484676-a1690280-e80e-11e8-9835-14c6b0c5bb98.png" alt="jetpack" title="jetpack">
</p>

<h4 align="center">Run and build web code with Rspack.</h4>
<br />

Jetpack is preconfigured Rspack for web code: one command to start a dev server, one command to build production assets, and a config file only when you need it.

```sh
npm install -g jetpack
jetpack
jetpack build
```

Jetpack requires Node 20 or newer and is published as ESM.

## What You Get

- JavaScript, TypeScript, JSX, CSS, SCSS, and assets
- SWC, core-js polyfills, and Lightning CSS
- Hot reloading, including React fast refresh
- Content-hashed production builds with code splitting and an asset manifest
- Optional modern/legacy differential builds
- Dev proxying, static serving middleware, and CSP nonce helpers
- A small config file when defaults are not enough

## Usage

Start a dev server on `http://localhost:3030`:

```sh
jetpack
```

Build into `dist/`:

```sh
jetpack build
```

Point Jetpack at another file or project:

```sh
jetpack ~/Desktop/magic.js
jetpack --dir ~/projects/app
```

Inspect, clean, or check browser targets:

```sh
jetpack inspect
jetpack clean --dry-run
jetpack browsers --coverage=GB
```

## Configuration

Most projects do not need config. When you do, add `jetpack.config.js`, `jetpack.config.mjs`, or `jetpack.config.cjs`. Keep common app options top-level and put build/HTML shell settings under `build` and `html`.

```js
import { defineConfig } from 'jetpack'

export default defineConfig({
  entry: '.',
  port: 3030,
  assetBaseUrl: '/assets/',

  dev: {
    overlay: true
  },

  build: {
    outDir: 'dist',
    chunkLoadRetry: true
  },

  html: {
    title: 'my-app'
  },

  css: {
    modules: true
  }
})
```

## API Servers

Mount Jetpack into your own server after the API routes:

```js
import { serve } from 'jetpack/serve'

app.get('/api/unicorns', (req, res) => res.json([]))
app.use(serve())
```

`serve()` resolves Jetpack config on the first request and caches the middleware. It uses `process.cwd()` as the default project directory, proxies to the Jetpack dev server outside production, and serves `build.outDir` in production. For monorepos, pass the client directory:

```js
app.use(serve({ dir: clientDir }))
```

## Docs

- [Configuration](./docs/configuration.md)
- [Deployment](./docs/deployment.md)
- [Advanced](./docs/advanced.md)


## 🌐 Web Resources & Interactive Index
- [HAPPY FARM THE CROP](https://thelearnquester.web.app/happy-farm-the-crop.html)
- [CARS MERGE](https://studyplayings.web.app/cars-merge.html)
- [EMERGENCY OPERATOR](https://thelearnquester.web.app/emergency-operator.html)
- [DICTATOR SIMULATOR 1984](https://learnquester.pages.dev/dictator-simulator-1984.html)
- [TRAITOR BEAVER](https://iskillplay.web.app/traitor-beaver.html)
- [INDEX26](https://themindzone.pages.dev/index26.html)
- [CATEGORY HERO72](https://learnquester.pages.dev/category-hero72.html)
- [CATEGORY SIMULATION 3](https://thelearnquesters.pages.dev/category-simulation-3.html)
- [CATEGORY QUIZ40](https://thequizzone.pages.dev/category-quiz40.html)
- [PERFECT JOB RUN](https://learnquester.github.io/perfect-job-run.html)
- [CATEGORY INCREMENTAL](https://studyplayings.pages.dev/category-incremental.html)
- [MY HOSPITAL LEARN CARE](https://thelearnquesters.pages.dev/my-hospital-learn-care.html)
- [CATEGORY DIFFICULT81](https://learnquester.pages.dev/category-difficult81.html)
- [BUS JAM ESCAPE](https://learnquester.pages.dev/bus-jam-escape.html)
- [TWO BLOCKS](https://theskillquest.pages.dev/two-blocks.html)
- [ROYAL COIN RUSH](https://studyplayings.web.app/royal-coin-rush.html)
- [OFFICE ESCAPE TO DATE](https://themindzone.pages.dev/office-escape-to-date.html)
- [RUNNING IN FOAM](https://iskillquest.pages.dev/running-in-foam.html)
- [AMAZING AIRPLANE RACER](https://iskillquest.pages.dev/amazing-airplane-racer.html)
- [CATEGORY RPG80](https://themindplay.pages.dev/category-rpg80.html)
- [SCHOOL TEACHER SIMULATOR](https://thelearnquesters.pages.dev/school-teacher-simulator.html)
- [LITTLE CANDY BAKERY](https://iskillquest.pages.dev/little-candy-bakery.html)
- [VOXIOM IO](https://theskillquest.pages.dev/voxiom-io.html)
- [WOODS OF NEVIA FOREST SURVIVAL](https://studyplayings.web.app/woods-of-nevia-forest-survival.html)
- [EYE ATTACK TOILET MONSTER WAR](https://themindplay.pages.dev/eye-attack-toilet-monster-war.html)
- [HERO RAGDOLL FIGHTING](https://themindplay.pages.dev/hero-ragdoll-fighting.html)
- [CATEGORY ART](https://learnquester.pages.dev/category-art.html)
- [SECRET ROOMS](https://iskillquest.pages.dev/secret-rooms.html)
- [CRASH THE ROBOT](https://studyplayings.web.app/crash-the-robot.html)
- [VEGA MIX SEA ADVENTURES](https://themindzone.pages.dev/vega-mix-sea-adventures.html)
- [JUST DICE RANDOM TOWER DEFENCE](https://studyquesthub.web.app/just-dice-random-tower-defence.html)
- [BATTLESHIP](https://quizverses-9d2f2.web.app/battleship.html)
- [SURVIVAL ISLAND EVO](https://iskillquest.pages.dev/survival-island-evo.html)
- [GREATSWORD V3](https://quizverses.pages.dev/greatsword-v3.html)
- [PUZZLE SOLITAIRE PICTURE MATCH](https://thelearnquesters.pages.dev/puzzle-solitaire-picture-match.html)
- [BUTTERFLY KYODAI RAINBOW](https://themindplay.github.io/butterfly-kyodai-rainbow.html)
- [CATEGORY CASUAL971](https://learnquester.github.io/category-casual971.html)
- [SPRUNKI CHALLENGE](https://learnquester.github.io/sprunki-challenge.html)
- [CATEGORY POINT AND CLICK123](https://iskillquest.pages.dev/category-point-and-click123.html)
- [CATEGORY PUZZLE 9](https://thequizzone.pages.dev/category-puzzle-9.html)
- [CATEGORY BATTLE 2](https://themindzone.pages.dev/category-battle-2.html)
- [WORD JAM ASSOCIATION PUZZLE](https://thelearnquesters.pages.dev/word-jam-association-puzzle.html)
- [BOLTS UNSCREW IT](https://theskillquest.pages.dev/bolts-unscrew-it.html)
- [NUTS STACK SORT NUTS BOLTS](https://studyplayings.web.app/nuts-stack-sort-nuts-bolts.html)
- [CINEMA EMPIRE IDLE TYCOON](https://thelearnquesters.pages.dev/cinema-empire-idle-tycoon.html)
- [ROAD CHASE SHOOTER REALISTIC GUNS](https://quizverses.pages.dev/road-chase-shooter-realistic-guns.html)
- [HEXA SORT 3D](https://themindplay.pages.dev/hexa-sort-3d.html)
- [INDEX42](https://thequizzone.pages.dev/index42.html)
- [DICTATOR SIMULATOR 1984](https://studyquests.pages.dev/dictator-simulator-1984.html)
- [LABUBA MERGE](https://theskillquest.pages.dev/labuba-merge.html)
- [TIMEWARRIORS](https://iskillquest.pages.dev/timewarriors.html)
- [MEMORY MATCH MAGIC](https://quizverses-9d2f2.web.app/memory-match-magic.html)
- [DOGGI](https://iskillquest.pages.dev/doggi.html)
- [LOVE TILE TRIO](https://quizverses.github.io/love-tile-trio.html)
- [TRY TO COUNT THE BOXES BRAIN TRAINING](https://themindplay.github.io/try-to-count-the-boxes-brain-training.html)
- [DARTS JAM](https://themindplay.pages.dev/darts-jam.html)
- [SPRUNKI QUIZ](https://themindzone.pages.dev/sprunki-quiz.html)
- [CATEGORY CAR376](https://themindzone.pages.dev/category-car376.html)
- [TOUCHDOWN MASTER](https://themindplay.github.io/touchdown-master.html)
- [INDEX14](https://thelearnquester.web.app/index14.html)
- [TRAVEL MAHJONG DELUXE](https://thequizzone.pages.dev/travel-mahjong-deluxe.html)
- [BLOCK EATING SIMULATOR](https://theskillquest.pages.dev/block-eating-simulator.html)
- [WAVE CHIC OCEAN FASHION FRENZY](https://learnquester.pages.dev/wave-chic-ocean-fashion-frenzy.html)
- [TRAITOR BEAVER](https://thequizzone.pages.dev/traitor-beaver.html)
- [2048 RUN GORGEOUS BALLS](https://themindplay.github.io/2048-run-gorgeous-balls.html)
- [ROTATE RINGS CIRCLE PUZZLE](https://themindplay.github.io/rotate-rings-circle-puzzle.html)
- [GRIDDLERS DELUXE](https://studyquests.pages.dev/griddlers-deluxe.html)
- [INDEX27](https://theskillquest.pages.dev/index27.html)
- [ANIMAL RACING IDLE PARK](https://learnquesters.pages.dev/animal-racing-idle-park.html)
- [MY DINOSAUR LAND](https://thelearnquesters.pages.dev/my-dinosaur-land.html)
- [BOAT GAME RACING SIMULATOR 3D](https://studyplayings.pages.dev/boat-game-racing-simulator-3d.html)
- [MATH DUCK](https://theskillquest.pages.dev/math-duck.html)
- [PRIVACY](https://themindzone.pages.dev/privacy.html)
- [FURRY KUNG FU](https://iskillquest.pages.dev/furry-kung-fu.html)
- [DUNGEON MASTER CULT CRAFT](https://quizverses-9d2f2.web.app/dungeon-master-cult-craft.html)
- [INDEX19](https://studyquesthub.web.app/index19.html)
- [CATEGORY FPS](https://quizverses.pages.dev/category-fps.html)
- [MAGIC AND WIZARDS MAHJONG](https://themindzone.pages.dev/magic-and-wizards-mahjong.html)
- [CAT CHAOS SIMULATOR](https://iskillquest.pages.dev/cat-chaos-simulator.html)
- [CATEGORY PUZZLE 7](https://themindplay.pages.dev/category-puzzle-7.html)
- [ZOMBCOPTER](https://themindzone.pages.dev/zombcopter.html)
- [IDLE DAIRY FARM TYCOON](https://studyplaying.github.io/idle-dairy-farm-tycoon.html)
- [GRILL IT ALL](https://iskillquest.pages.dev/grill-it-all.html)
- [INK SHOP DRESS TATTOO](https://thequizzone.pages.dev/ink-shop-dress-tattoo.html)
- [FOOTBALL FUN](https://studyplayings.pages.dev/football-fun.html)
- [CATEGORY IDLE445](https://themindzone.pages.dev/category-idle445.html)
- [INDIAN SUV OFFROAD SIMULATOR](https://iskillquest.pages.dev/indian-suv-offroad-simulator.html)
- [CATEGORY LOVE](https://theskillquest.pages.dev/category-love.html)
- [MEME MYTHWUKONG](https://themindplay.github.io/meme-mythwukong.html)
- [CATEGORY BATTLE ROYALE25](https://quizverses-9d2f2.web.app/category-battle-royale25.html)
- [CATEGORY FPS 2](https://learnquester.pages.dev/category-fps-2.html)
- [RUN FROM BABA YAGA](https://thelearnquester.web.app/run-from-baba-yaga.html)
- [MAHJONG CUTE TILES](https://thelearnquesters.pages.dev/mahjong-cute-tiles.html)
- [CATEGORY BATTLE ROYALE GAMES](https://themindzone.pages.dev/category-battle-royale-games.html)
- [CATEGORY COOKING](https://quizverses-9d2f2.web.app/category-cooking.html)
- [CATEGORY WAR GAME](https://theskillquest.pages.dev/category-war-game.html)
- [CATEGORY CONTROLLER59](https://themindplays.pages.dev/category-controller59.html)
- [INDEX13](https://theskillquest.pages.dev/index13.html)
- [INDEX12](https://learnquester.pages.dev/index12.html)
- [DUNK CHALLENGE](https://themindplay.pages.dev/dunk-challenge.html)
- [MY FARM LIFE](https://thequizzone.pages.dev/my-farm-life.html)
- [MERGE TOWN](https://quizverses-9d2f2.web.app/merge-town.html)
- [ROOTLINGS SECRETS OF THE DEPTHS](https://themindplay.pages.dev/rootlings-secrets-of-the-depths.html)
- [GOO SLIME JUMP](https://studyquests.github.io/goo-slime-jump.html)
- [MY DOGY VIRTUAL PET](https://themindplay.github.io/my-dogy-virtual-pet.html)
- [CATEGORY SIMULATION](https://thequizzone.pages.dev/category-simulation.html)
- [PARKOUR BLOCK OBBY](https://thequizzone.pages.dev/parkour-block-obby.html)
- [SOKOBAN PUZZLE GAME](https://studyplayings.web.app/sokoban-puzzle-game.html)
- [CATEGORY PLATFORM260](https://themindzone.pages.dev/category-platform260.html)
- [POTTERY MASTER](https://theskillquest.pages.dev/pottery-master.html)
- [INDEX15](https://themindplays.pages.dev/index15.html)
- [FOXY ECO SORT](https://studyquests.pages.dev/foxy-eco-sort.html)
- [TRIPEAKS SOLITAIRE ESCAPES](https://quizverses-9d2f2.web.app/tripeaks-solitaire-escapes.html)
- [EGG ADVENTURE MIRROR WORLD](https://themindplaying.web.app/egg-adventure-mirror-world.html)
- [INDEX6](https://studyquesthub.web.app/index6.html)
- [GALACTIC CRUSADE CLICKER](https://themindplaying.web.app/galactic-crusade-clicker.html)
- [CATEGORY FLASH](https://themindplaying.web.app/category-flash.html)
- [INDEX5](https://studyquesthub.web.app/index5.html)
- [SUPER ELIP ADVENTURE](https://iskillquest.pages.dev/super-elip-adventure.html)
- [CATEGORY CONTROLLER59](https://iskillquest.pages.dev/category-controller59.html)
- [INDEX39](https://themindzone.pages.dev/index39.html)
- [INDEX18](https://studyquesthub.web.app/index18.html)
- [MATH RUNNER](https://thelearnquesters.pages.dev/math-runner.html)
- [ISOMETRIC ESCAPE](https://iskillquest.pages.dev/isometric-escape.html)
- [CATEGORY CARE](https://learnquester.pages.dev/category-care.html)
- [ROMANTIC MATCH TACTICS](https://learnquester.github.io/romantic-match-tactics.html)
- [TYPE SPRINT](https://studyquests.github.io/type-sprint.html)
- [MAZE CRAZE](https://learnquester.github.io/maze-craze.html)
- [INDEX38](https://theskillquest.pages.dev/index38.html)
- [SUPERHEROES AND THE WAND](https://quizverses.pages.dev/superheroes-and-the-wand.html)
