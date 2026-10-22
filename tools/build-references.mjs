// Builds REFERENCES.md from the References sections of the plate files in text/, in the reading order of js/atlas.js.
// tools/build-text.mjs runs it, so `npm run text` builds both files and `npm run text -- --check` checks both.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const REFS_OUT = join(ROOT, 'REFERENCES.md');
const SITE = 'https://matteohe.com/atlas-of-loss-surfaces/';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

// the Markdown of the text files as plain text: glossary links keep their shown text, HTML tags are dropped
const plain = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, '$1').replace(/<\/?[a-z]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

function plates() {
  const out = {};
  for (const d of readdirSync(join(ROOT, 'text')).sort()) {
    const m = d.match(/^(\d+)-/); if (!m) continue;
    for (const f of readdirSync(join(ROOT, 'text', d))) {
      if (!f.endsWith('.md') || f.startsWith('_') || f === 'README.md') continue;
      const src = readFileSync(join(ROOT, 'text', d, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      const sec = src.split(/^## References\s*$/m)[1].split(/^## /m)[0];
      const refs = [];
      for (const l of sec.split('\n')) {
        if (l.startsWith('- ')) refs.push({ cite: l.slice(2).trim(), note: [] });
        else if (/^\s+\S/.test(l) && refs.length) refs[refs.length - 1].note.push(l.trim());
      }
      out[f.slice(0, -3)] = { ch: +m[1] - 1, title: plain(src.match(/^# (.+)$/m)[1]), refs: refs.map((r) => [plain(r.cite), plain(r.note.join(' '))]) };
    }
  }
  return out;
}

export function references() {
  const order = JSON.parse(readFileSync(join(ROOT, 'js/atlas.js'), 'utf8').match(/const ORDER = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
  const chapters = readFileSync(join(ROOT, 'text/chapters.md'), 'utf8').split('\n').map((l) => l.match(/^(\d+)\. (.+)$/)).filter(Boolean).map((m) => m[2].trim());
  const P = plates(), all = new Set();
  let body = '', ch = -1;
  order.filter((id) => P[id]).forEach((id, k) => {      // a plate in the reading order may not have its text yet
    const p = P[id];
    if (p.ch !== ch) { ch = p.ch; body += `### ${ROMAN[ch]} · ${chapters[ch]}\n\n`; }
    body += `**${k + 1}. [${p.title}](${SITE}?plate=${id})**\n\n`;
    for (const [cite, note] of p.refs) { body += `- ${cite} *${note}*\n`; all.add(cite); }
    body += '\n';
  });
  const coll = new Intl.Collator('en', { sensitivity: 'base' });
  return `# References

Every plate cites the papers it draws on: ${all.size} works in all. They are listed here by plate, each with a note on what it
contributed, and then alphabetically. Each plate title links to that plate in the atlas. The about panel (press I in the
atlas) cites a few more, on what a two-parameter map cannot show; they are listed in the panel.

If a claim on a plate looks wrong, please [open an issue](https://github.com/hematteo/atlas-of-loss-surfaces/issues/new?template=plate-error.yml).

## By plate

${body}## All works, alphabetically

${[...all].sort(coll.compare).map((c) => `- ${c}`).join('\n')}
`;
}
