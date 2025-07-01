#!/usr/bin/env node
// update-tsconfig-t.cjs

const fs = require('fs');
const path = require('path');
const argv = require('./arguments');

const repoRoot = argv.dir;
const ROOT_NAME = 'tsconfig.functional.json';
const rootPath = path.join(repoRoot, ROOT_NAME);

// 1. Create root config if missing
if (!fs.existsSync(rootPath)) {
    const defaultRoot = {
        "compilerOptions": {
            "skipLibCheck": true,
            "baseUrl": ".",
            "allowJs": true,
            "module": "ESNext",
            "target": "ESNext",
            "lib": [
                "es2018",
                "dom"
            ],
            "paths": {
                "*": [
                    "./*"
                ]
            },
            "outDir": "./lib",
            "types": [
                "node",
                "@wdio/globals/types",
                "@wdio/mocha-framework",
                "reflect-metadata",
                "expect-webdriverio"
            ],
            "noImplicitAny": false,
            "moduleResolution": "node",
            "allowSyntheticDefaultImports": true,
            "declaration": true,
            "declarationMap": true,
            "sourceMap": true,
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true,
            "resolveJsonModule": true
        },
        "include": [
            "**/*.spec.ts",
            "**/*.ts",
            "**/**/*.json",
            "functional/config/runner-config/*.js"
        ],
        "exclude": [
            "src/**/*.ts",
            "src/**/*.spec.ts",
            "node_modules",
            "../../../node_modules/",
            "dist"
        ]
    };
    fs.writeFileSync(rootPath, JSON.stringify(defaultRoot, null, 2) + '\n');
    console.log(`✔ Created ${ROOT_NAME} in repo root`);
}

// 2. Walk the directory tree
function walk(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!['node_modules', '.git'].includes(entry.name)) {
                walk(fullPath, callback);
            }
        } else if (entry.isFile()) {
            callback(fullPath);
        }
    }
}

// 3. Overwrite all tsconfig.t.json files except the root one
walk(repoRoot, (file) => {
    if (file.endsWith(ROOT_NAME) && file !== rootPath) {
        const rel = path.relative(path.dirname(file), repoRoot).split(path.sep).join('/') || '.';
        const minimal = {
            extends: `${rel}/${ROOT_NAME}`
        };
        fs.writeFileSync(file, JSON.stringify(minimal, null, 2) + '\n');
        console.log(`✔ Overwritten ${file}`);
    }
});

console.log('✅ All done. Review with "git diff" and commit!');

