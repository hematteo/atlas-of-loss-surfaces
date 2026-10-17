# The atlas's text

Everything the atlas says is in this folder, as Markdown: one file per plate, plus the glossary and the about panel.
You can edit it without touching the code.

```
text/
  chapters.md              the eight chapter titles
  1-landforms/survey.md    one file per plate, in its chapter's folder, named after the plate's id
  …
  6-proving-grounds/_shared.md   text shared by the proving-ground plates
  glossary.md              the definitions shown when you hover a linked term
  about.md                 the about panel (press I in the atlas)
```

## Seeing your edits

The page reads the text from `js/text.js`, which is built from these files. After editing, rebuild it and reload the
page:

```sh
npm run text               # build once
npm run text -- --watch    # rebuild on every save
```

You need [Node](https://nodejs.org) 20 or later, and nothing else. If a file has a mistake, the build names the file
and line. Commit `js/text.js` along with your Markdown: the site is served as is, with no build step. `npm test`, and
CI on every push, fail if `js/text.js` is out of date.

## A plate file

A plate file is a title and a fixed set of sections, in the order they appear on the plate card:

```markdown
# Sharp and flat minima

## Subtitle
One line under the title.

## Lead
The opening paragraphs.

## In practice
What the result means for training a real network.

## Figure caption
The caption under the plate's figure.

## Try
1. An experiment to try → what you should see.
2. Another.

## Background
## Method
## Caveat

## References
- Hochreiter, S. and Schmidhuber, J. (1997). Flat minima. Neural Computation 9(1).
  The note shown under the citation: what this paper contributes to the plate.
```

*Subtitle*, *Lead*, *Try*, *Method* and *References* are required; the rest are optional.

## Writing

- **Paragraphs** are separated by a blank line. Lines within a paragraph are joined with a space, so break lines
  wherever you like. The files use one sentence per line, which keeps diffs readable.
- **Numbered lists** (`1. `) are the only Markdown lists. A list item can run over several lines; indent the
  continuation lines.
- **Code**: `` `L(θ)` `` sets a formula in the code face.
- **Glossary links**: `[[saddle|saddle]]` shows "saddle" and links it to the glossary entry with key `saddle`.
  `[[the pass|@Saddle of Hesitation]]` instead rings the map label called "Saddle of Hesitation" when hovered.
- **Everything else is HTML**: `<i>`, `<em>`, `<sub>`, `<sup>`, `<kbd>`. Markdown's `*emphasis*` and `**bold**` are
  *not* converted, because `L*` and `θ*` are everywhere in the text. Write `λ<sub>max</sub>`, `<i>Title</i>`.
- **Notes to other editors** go in HTML comments, `<!-- like this -->`. They are left out of the page.
- Write in plain, specific sentences, and check every number against the plate: each one on a card is meant to be
  something the reader can see or measure on that plate.

## The glossary

Each entry is a heading `## key: Term`, followed by the definition as a single paragraph. The key is what a link
writes after the `|`.

```markdown
## saddle: Saddle point

A critical point where the loss curves up in some directions and down in others.
```

## Adding a plate

A new plate needs code as well: its surface, optimizers and figure are in `js/atlas.js`. Add its text file here,
named after its `id`, in the folder of its chapter. The smoke test (`npm test`) fails if a plate has no text file, if
a text file has no plate, or if a file sits in the wrong chapter's folder.
