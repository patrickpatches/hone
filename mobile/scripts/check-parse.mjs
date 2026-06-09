/**
 * Real-parser source guard (R-014, strengthened).
 *
 * Why this exists: the byte-truncation class of bug (a file written/saved
 * half-way, ending mid-string or mid-token) repeatedly reached the native
 * build and failed ~8 minutes in, inside Hermes' BundleHermesCTask, e.g.
 *   SyntaxError: seed-recipes.ts: Unterminated string constant. (5832:15)
 *
 * scripts/check-ts-truncation.sh catches the obvious cases by inspecting the
 * LAST character — but a file truncated right after a comma ("AGLIO_E_OLIO,")
 * ends in ',' and slips through while still being broken. The only reliable
 * detector is to actually PARSE every file with the same parser the bundler
 * uses (@babel/parser with the TypeScript plugin — what Metro runs under the
 * hood). If Babel can't parse it, Hermes can't bundle it, and the build will
 * fail. We'd rather know in 5 seconds than 8 minutes.
 *
 * Run:  node scripts/check-parse.mjs        (from the mobile/ directory)
 * Exit: 0 = all files parsed; 1 = at least one file failed (prints location).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');

// Only the source that ships in the app bundle. Mirror check-ts-truncation.sh.
const ROOTS = ['src', 'app'];
const SKIP_DIRS = new Set([
  'node_modules', '.expo', 'android', 'ios', '_test', '.git',
]);

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, out);
    } else {
      const ext = extname(entry);
      if ((ext === '.ts' || ext === '.tsx') && !entry.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  }
}

const files = [];
for (const r of ROOTS) {
  try { walk(r, files); } catch { /* root may not exist; ignore */ }
}
files.sort();

const failures = [];
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  try {
    parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch (e) {
    const loc = e.loc ? ` (line ${e.loc.line}:${e.loc.column})` : '';
    failures.push({ file, msg: e.message.split('\n')[0], loc });
  }
}

if (failures.length) {
  console.error('\n============================================================');
  console.error(`R-014 PARSE GUARD: ${failures.length} file(s) failed to parse.`);
  console.error('A file that does not parse here will fail Hermes bundling.');
  console.error('============================================================');
  for (const f of failures) {
    console.error(`\n❌ ${f.file}${f.loc}`);
    console.error(`   ${f.msg}`);
  }
  console.error('\nRecover:  git show HEAD:<path> > /tmp/clean.ts  then re-apply edits.\n');
  process.exit(1);
}

console.log(`✅ R-014 parse guard: ${files.length} .ts/.tsx files all parse cleanly.`);
