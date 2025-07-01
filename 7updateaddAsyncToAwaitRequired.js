#!/usr/bin/env node
/**
 * add-async-and-fix-return.js
 * ---------------------------------------------------------------
 * • Adds `async` to any function-like node that awaits.
 * • Ensures the explicit return type (if any) is Promise<…>
 *   when the function is async.
 *
 *   node add-async-and-fix-return.js --dir=src
 *   node add-async-and-fix-return.js -d packages/foo --tsconfig tsconfig.base.json
 * --------------------------------------------------------------- */

const path   = require('path');
const fs     = require('fs');
const fg     = require('fast-glob');
const { Project, SyntaxKind } = require('ts-morph');
const argv = require('./arguments');


const ROOT = path.resolve(process.cwd(), argv.dir);
if (!fs.existsSync(ROOT)) {
  console.error(`❌  Folder not found: ${ROOT}`);
  process.exit(1);
}

/* ------------------ Collect source files ---------------------- */
const files = fg.sync(['**/*.ts', '**/*.tsx'], {
  cwd: ROOT, absolute: true, ignore: ['**/*.d.ts']
});
if (files.length === 0) {
  console.warn('⚠️  No .ts/.tsx files under', ROOT);
  process.exit(0);
}

/* ------------------ ts-morph project -------------------------- */
const project = new Project({
  tsConfigFilePath: argv.dir + '/tsconfig.functional.json',
  skipAddingFilesFromTsConfig: true
});
project.addSourceFilesAtPaths(files);

/* ------------------ Helpers ----------------------------------- */
const FUNC_KINDS = new Set([
  SyntaxKind.FunctionDeclaration,
  SyntaxKind.FunctionExpression,
  SyntaxKind.ArrowFunction,
  SyntaxKind.MethodDeclaration
]);

const isFuncLike = (n) => FUNC_KINDS.has(n.getKind());

/** True if `await` inside `fn` belongs directly to `fn` (not nested) */
function hasOwnAwait(fn) {
  return fn.getDescendantsOfKind(SyntaxKind.AwaitExpression).some((aw) => {
    let p = aw.getParent();
    while (p && !isFuncLike(p)) p = p.getParent();
    return p === fn;
  });
}

/** Ensure explicit return type matches async-ness */
function fixReturnType(fn) {
  const rtNode = fn.getReturnTypeNode?.();
  if (!rtNode) return;                     // no explicit annotation → skip

  const txt = rtNode.getText().trim();
  if (txt.startsWith('Promise<') || txt === 'Promise') return; // already good

  fn.setReturnType(`Promise<${txt}>`);
}

/* ------------------ Main pass --------------------------------- */
let touched = 0;

for (const sf of project.getSourceFiles()) {
  let changed = false;

  sf.forEachDescendant((node) => {
    if (!isFuncLike(node) || node.isGenerator?.()) return;

    const awaits = hasOwnAwait(node);
    const async  = node.isAsync?.();

    // (1) add async + fix return
    if (awaits && !async) {
      node.setIsAsync?.(true);
      fixReturnType(node);
      changed = true;
    }

    // (2) already async but wrong return type
    if (async) {
      fixReturnType(node);
      changed = changed || node.wasForgotten?.() === false; // setReturnType marks changed
    }
  });

  if (changed) {
    sf.saveSync();
    console.log('✔', path.relative(ROOT, sf.getFilePath()));
    touched++;
  }
}

console.log(`\n✨  Done. Updated ${touched} file(s) in ${ROOT}`);
