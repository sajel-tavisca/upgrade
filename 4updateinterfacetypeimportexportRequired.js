#!/usr/bin/env node
/* fix-type-imports.js – v3
 * ---------------------------------------------------------------
 * Converts type-only symbols to `import type` / `export type`.
 * Safe against ts-morph “InvalidOperationError” by gathering
 * everything first, then mutating.
 *
 *   node fix-type-imports.js --dir=path/to/folder [--tsconfig=./tsconfig.json]
 * --------------------------------------------------------------- */

const path   = require('path');
const fs     = require('fs');
const fg     = require('fast-glob');
const { Project, ts } = require('ts-morph');
const argv = require('./arguments');

const ROOT = path.resolve(process.cwd(), argv.dir);
if (!fs.existsSync(ROOT)) {
  console.error(`❌  Directory not found: ${ROOT}`);
  process.exit(1);
}

/* ---------- Gather files --------------------------------------- */
const filePaths = fg.sync(['**/*.ts', '**/*.tsx'], {
  cwd: ROOT, absolute: true, ignore: ['**/*.d.ts']
});
if (filePaths.length === 0) {
  console.warn('⚠️  No .ts/.tsx files under', ROOT);
  process.exit(0);
}

/* ---------- Setup ts-morph project ----------------------------- */
const project = new Project({
  tsConfigFilePath: argv.dir + '/tsconfig.functional.json',
  skipAddingFilesFromTsConfig: true
});
project.addSourceFilesAtPaths(filePaths);
const checker = project.getTypeChecker();

/* ---------- Helpers ------------------------------------------- */
const T = ts.SymbolFlags;
/* “Pure type” = contributes no runtime value */
const PURE_TYPE_FLAGS =
  T.TypeAlias | T.Interface | T.TypeParameter | T.TypeLiteral |
  T.Signature | T.NamespaceModule | T.Instantiated;

const unwrap = (sym) => checker.getAliasedSymbol(sym ?? undefined) || sym;
const isPureType = (sym) => !!sym && (unwrap(sym).getFlags() & PURE_TYPE_FLAGS) !== 0;

/* ---------- Main loop ----------------------------------------- */
let touched = 0;

for (const sf of project.getSourceFiles()) {
  let changed = false;

  /* ---------- IMPORTS ---------------------------------------- */
  sf.getImportDeclarations().forEach((decl) => {
    if (decl.isTypeOnly()) return;

    const infos = decl.getNamedImports().map((ni) => ({
      text:  ni.getText(),
      node:  ni,
      isTyp: isPureType(ni.getNameNode().getSymbol()),
    }));

    const typeInfos  = infos.filter(i => i.isTyp);
    const valueInfos = infos.filter(i => !i.isTyp);
    if (typeInfos.length === 0) return;

    if (valueInfos.length === 0) {
      decl.setIsTypeOnly(true);
    } else {
      typeInfos.forEach(i => i.node.remove());          // mutate *after* gather
      sf.insertImportDeclaration(decl.getChildIndex(), {
        namedImports:   typeInfos.map(i => i.text),
        moduleSpecifier: decl.getModuleSpecifierValue(),
        isTypeOnly:      true,
      });
    }
    changed = true;
  });

  /* ---------- EXPORTS ---------------------------------------- */
  sf.getExportDeclarations().forEach((decl) => {
    if (decl.isTypeOnly()) return;

    const infos = decl.getNamedExports().map((ne) => ({
      text:  ne.getText(),
      node:  ne,
      isTyp: isPureType(ne.getNameNode().getSymbol()),
    }));

    const typeInfos  = infos.filter(i => i.isTyp);
    const valueInfos = infos.filter(i => !i.isTyp);
    if (typeInfos.length === 0) return;

    if (valueInfos.length === 0) {
      decl.setIsTypeOnly(true);
    } else {
      typeInfos.forEach(i => i.node.remove());
      sf.insertExportDeclaration(decl.getChildIndex(), {
        namedExports:    typeInfos.map(i => i.text),
        moduleSpecifier: decl.getModuleSpecifierValue() || undefined,
        isTypeOnly:      true,
      });
    }
    changed = true;
  });

  if (changed) {
    sf.saveSync();
    console.log('✔', path.relative(ROOT, sf.getFilePath()));
    touched++;
  }
}

console.log(`\n✨  Finished. Updated ${touched} file(s) in ${ROOT}`);
