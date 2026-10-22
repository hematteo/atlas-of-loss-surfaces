# An Atlas of Loss Surfaces

[![Open the atlas](https://img.shields.io/badge/open-the%20atlas-4b3fa0)](https://matteohe.com/atlas-of-loss-surfaces/)
[![test](https://github.com/hematteo/atlas-of-loss-surfaces/actions/workflows/test.yml/badge.svg)](https://github.com/hematteo/atlas-of-loss-surfaces/actions/workflows/test.yml)
[![Licence: MIT](https://img.shields.io/badge/code-MIT-24262b)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-24262b)](https://creativecommons.org/licenses/by/4.0/)

I wanted to see what the optimization papers describe, so I drew it. Those papers are about saddles, ravines and the
edge of stability in networks with millions of parameters, which we cannot picture directly. Two parameters can be
drawn, and they are enough to show most of what those words mean.

Each plate is a small loss surface built to show one thing from the literature, as a raised-relief map you can turn
and approach. Particles cross it taking real optimizer steps, leave ink, and come to rest where the theory says they
should. So when a plate states a result, we can watch it happen there. Every plate cites its sources
([277 works](REFERENCES.md)).

**[Open the atlas →](https://matteohe.com/atlas-of-loss-surfaces/)**

![The atlas in a browser: a printed loss surface rises into relief while cohorts of SGD, heavy-ball and Adam particles set off across it, with the plate card on the right and the tools along the bottom](img/hero.gif)

The plates are grouped in eight chapters:

![One plate from each chapter: Ravines, Stability and catapults, Adam, sign descent and the axes, The river valley, Mode connectivity, Rastrigin's egg crate, Two players on one sheet, The safety basin](img/chapters.jpg)


1. **Landforms**: a survey of a loss surface, basins of attraction, saddles, plateaus, ravines, cliffs, sharp and flat minima
2. **Step size and noise**: stability and catapults, the edge of stability, implicit gradient regularization, noise as
   temperature, the shape and the tails of the noise, label noise
3. **Optimizers**: momentum, Adam and sign descent, weight decay and scale invariance, Newton's method, sharpness-aware
   minimization, weight averaging
4. **Trajectories**: saddle to saddle, warmup, the river valley
5. **Solutions**: mode connectivity, forks in the road, symmetry and re-basin, singular minima and the learning
   coefficient
6. **Proving grounds**: Rosenbrock, Himmelblau, Rastrigin, Ackley, the six-hump camel, and a sheet you sculpt yourself
7. **Where there is no bottom**: two players on one sheet, the pull of softmax, the road to infinity
8. **After pretraining**: likelihood displacement, entropy collapse, RL's razor, the safety basin

The optimizers are gradient descent and SGD, heavy ball, Nesterov, Adam, RMSprop, sign descent, Lion, SAM, Newton,
saddle-free Newton and schedule-free SGD, plus plate-specific update rules for games and policy gradients.

## How it is built

Every sheet is an analytic function, and every number printed on a plate is computed from the surface it is printed
on. Critical points are found by Newton's method and curvatures come from the Hessian, while rates, escape times and
equilibria are measured from the particles. So each number on a card is something you can check on its plate.

Each plate card states the finding and cites the papers it comes from. For most plates it also says how settled the
result is. It then gives experiments to try, with predictions that were checked in the page. A section of the card,
*Limits*, says what the two-parameter sheet simplifies and how the result changes in networks with millions or
billions of parameters. The about panel (**I**) explains what a two-parameter map cannot show.

Come close and the particles become stick men, which makes each optimizer's state visible at a glance. Their gait,
poses and reactions are read from that state: they scratch their heads at saddles, cartwheel when catapulted, and sit
round a fire at rest points. How they sit depends on how sharp the minimum is for their step size.

![Dusk at a rest point: stick men round a campfire by a paper tent on a raised-relief map, one toasting a marshmallow, one lying back pointing at the stars](img/preview.jpg)

## Using it

- Drag to turn the model, right-drag to pan, scroll to approach, click to release a cohort.
- **↑ ↓** move between plates; **E** opens the plate card; **I** the about panel, with every key.
- **Set up** beside a Try step sets the instruments and releases the particles that step describes.
- The address bar keeps the plate, the seed and any instrument you have moved, so a link reopens the same experiment.
- The toolbar along the bottom (on a phone, at the top of the plate card) holds the modes: walk with a stick man
  (**W**), cross-section (**X**), flood (**D**), plan view (**T**), dusk (**N**) and watch a few stick men up close
  (**O**).
- **P** parameters and seed, **S** capture the frame as a PNG, **H** hide the interface.

It runs in any browser with WebGL2. It is plain HTML, JavaScript and WebGL2, with no JavaScript libraries and nothing
to build before serving it. To run it locally, open `index.html`, or serve the folder with `python3 -m http.server`.

## Editing the text

All the prose is Markdown in [`text/`](text/): one file per plate, plus the glossary and the about panel. So you can
correct or extend it without reading any code, and [`text/README.md`](text/README.md) describes the format. After
editing, run `npm run text` (it needs only Node 20 or later). It rebuilds `js/text.js`, which the page loads, and
`REFERENCES.md`. Commit both with your edits, since the site is served as is, with no build step.

## How the code is laid out

- `index.html`: the page, its metadata and four scripts.
- `text/`: all the prose, in Markdown (see above). `tools/build-text.mjs` builds it into `js/text.js`, which defines
  one global, `TEXT`.
- `js/atlas.js`: the atlas, one script. Sections open with a `// ----` banner, in this order:
  - the surfaces: seeded noise, the loss `L(θ₁, θ₂)`, the height grid, critical points (grid scan, Newton
    refinement, Hessian classification), cross-sections and the disconnectivity scaffold;
  - the optimizers and the forty plates. Each plate is one object, `plate({ … })`, holding its sheet builder, names,
    experiments, figure and `run`, the functions behind its Try steps' **Set up** buttons (one entry per step, `null`
    for none); `plate()` adds its text from `TEXT.plates[id]`. Plates sit in blocks marked
    `// <<chN … // chN>>`, which group them roughly in the order they were written, not by chapter; a plate's chapter
    is its `ch` field, and the reading order is the `ORDER` list;
  - the WebGL renderer (relief, ink, baked shadows, and the stick men, drawn as signed-distance figures in a
    fragment shader) and the printed layer (names, contours, margin);
  - the particles: a struct-of-arrays simulation that steps every optimizer on the same stochastic gradient;
  - the camera, the pointer, the overlay (labels, the hover instrument, campfires), the plate card, plate building
    and the main loop.
- `js/frame.js`, `js/gl.js`, `css/frame.css`: a small runtime shared with other pieces by the same author (title,
  about and parameter panels, seeds, capture, WebGL helpers).
- `css/atlas.css`: the atlas's own interface.

Some internal names predate the current wording: `TRIBES` are the optimizers, the `pilgrim…` functions draw the
stick men, and the project was first called Pilgrims.

## Testing

`npm test` checks that `js/text.js` is up to date with `text/`, then serves the folder, opens the atlas in headless
Chromium with software WebGL2, and visits all forty plates. It fails on any page or console error, any non-finite
particle, the error screen, or text that belongs to no plate, and checks the phone layout. It runs on every push
([workflow](.github/workflows/test.yml)). The site itself needs no install; `package.json` exists only for the text
build and the test.

```sh
npm ci && npx playwright install chromium && npm test
```

## Corrections

The cards make specific, checkable claims, and every plate cites the papers its findings come from. If one looks
wrong, please
[open an issue](https://github.com/hematteo/atlas-of-loss-surfaces/issues/new?template=plate-error.yml) with the plate,
the claim and a source.

## Citing

GitHub's **Cite this repository** button gives the reference, from [`CITATION.cff`](CITATION.cff).

## Credits and licence

By hematteo, made with Claude (Anthropic). The results shown belong to the authors of the papers cited on each plate.
The atlas only draws them.

Code: [MIT](LICENSE). Text, figures and images: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), so they can
be reused with credit.
