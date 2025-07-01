#!/usr/bin/env node


const fs    = require('fs');
const path  = require('path');
const fg    = require('fast-glob');          // handles globs for us
const argv = require('./arguments');

/* ✂︎  What you want to add right after the last existing import   */
const LINES_TO_INSERT = [
 `import { fileURLToPath } from 'url';
  import { dirname } from 'path';
  // Get the current file URL
  const __filename = fileURLToPath(import.meta.url);
  // Get the directory name of the current module
  const __dirname = dirname(__filename);`
];

 argv.files  = [argv.dir+ '/functional/data/culture-text-collator.ts', argv.dir+ '/functional/data/test-data-collator.ts']
console.log(argv.files)
/* `argv.files` holds the array of positional values. Resolve globs. */
const targets = fg.sync(argv.files, { absolute: true });

if (targets.length === 0) {
  console.error('❌  No files matched those patterns.');
  process.exit(1);
}

/* ---------- 2. Process each file -------------------------------- */
for (const absPath of targets) {
  if (!absPath.endsWith('.ts') && !absPath.endsWith('.tsx')) {
    console.log('• Skip (not TS):', path.relative(process.cwd(), absPath));
    continue;
  }

  const code  = fs.readFileSync(absPath, 'utf8');
  const lines = code.split(/\r?\n/);

  /* find last `import` */
  let lastImport = -1;
  lines.forEach((l, i) => { if (/^\s*import\b/.test(l)) lastImport = i; });

  /* avoid duplicates */
  const already = LINES_TO_INSERT.every(newLine =>
    lines.some(existing => existing.trim() === newLine)
  );
  if (already) {
    console.log('•', path.relative(process.cwd(), absPath), '(already has lines)');
    continue;
  }

  const insertAt = lastImport >= 0 ? lastImport + 1 : 0;
  lines.splice(insertAt, 0, ...LINES_TO_INSERT, ''); // add blank line after
  fs.writeFileSync(absPath, lines.join('\n'), 'utf8');
  console.log('✔', path.relative(process.cwd(), absPath), 'updated');
}

console.log('\nDone.');

