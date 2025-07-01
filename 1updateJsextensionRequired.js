#!/usr/bin/env node
/* eslint-disable no-console */

const path   = require('path');
const fs     = require('fs');
const {glob}   = require('glob');
const recast = require('recast');
const argv = require('./arguments');

const ROOT = path.resolve(process.cwd(), argv.dir);

const IGNORE_SUFFIXES = [
  '.js', '.mjs', '.cjs',
  '.json', '.ts', '.tsx', '.jsx'
];

const isRelativePath = (spec) =>
  spec.startsWith('./') || spec.startsWith('../');

const needsDotJs = (spec) =>
  isRelativePath(spec) &&
  !IGNORE_SUFFIXES.some((s) => spec.endsWith(s));

(async () => {
  const files = await glob('**/*.ts', { cwd: ROOT, absolute: true });

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const ast    = recast.parse(source, {
      parser: require('recast/parsers/typescript')
    });

    let changed = false;

    recast.types.visit(ast, {
      visitImportDeclaration(path) {
        const spec = path.node.source.value;
        if (typeof spec === 'string' && needsDotJs(spec)) {
          path.node.source.value = `${spec}.js`;
          changed = true;
        }
        this.traverse(path);
      },
      visitExportNamedDeclaration(path) {
        const src = path.node.source;
        if (src && typeof src.value === 'string' && needsDotJs(src.value)) {
          src.value = `${src.value}.js`;
          changed = true;
        }
        this.traverse(path);
      },
      visitExportAllDeclaration(path) {
        const src = path.node.source;
        if (src && typeof src.value === 'string' && needsDotJs(src.value)) {
          src.value = `${src.value}.js`;
          changed = true;
        }
        this.traverse(path);
      }
    });

    if (changed) {
      const output = recast.print(ast).code;
      fs.writeFileSync(file, output, 'utf8');
      console.log(`✔ Fixed ${path.relative(ROOT, file)}`);
    }
  }

  console.log(`\nFinished scanning ${files.length} file(s) in ${ROOT}`);
})();
