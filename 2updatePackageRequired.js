#!/usr/bin/env node
/* add-type-module.js
 * -------------------------------------------------------------
 * Usage:   node add-type-module.js --dir path/to/project
 *          node add-type-module.js -d .
 * ------------------------------------------------------------- */

const fs    = require('fs');
const path  = require('path');
const argv = require('./arguments');


/* ----------- Locate & read package.json -------------------------- */
const pkgPath = path.resolve(argv.dir, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('❌  No package.json found at', pkgPath);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

/* ----------- Modify & save -------------------------------------- */
if (pkg.type === 'module') {
  console.log('• "type" already set to "module" – nothing to do.');
  process.exit(0);
}

pkg.type = 'module';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✔ Added "type": "module" to', pkgPath);
