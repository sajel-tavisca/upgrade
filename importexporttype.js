const fs = require('fs');
const path = require('path');
const argv = require('./arguments');


const targetDir = argv.dir; // ✅ Change this to your directory

// Match import { ... } from '...';
const importRegex = /^import\s+{\s*([^}]+)\s*}\s+from\s+['"](.+?)['"];$/gm;

// Match export { ... };
const exportRegex = /^export\s+{\s*([^}]+)\s*};$/gm;

function convertImportsExports(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Convert imports that are from files containing 'interface'
  content = content.replace(importRegex, (match, imports, modulePath) => {
    if (modulePath.toLowerCase().includes('interface')) {
      updated = true;
      return `import type { ${imports.trim()} } from '${modulePath}';`;
    }
    return match; // leave unchanged
  });

  if(updated){
     // Convert exports only if they match something from 'interface' imports (optional strictness)
    content = content.replace(exportRegex, (match, exports) => {
        // In a full parser you'd track imported type names, but here we just convert blindly for simplicity.
        return `export type { ${exports.trim()} };`;
    });
  }
  

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

function walkDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else {
      convertImportsExports(fullPath);
    }
  }
}

// 🚀 Start
if (fs.existsSync(targetDir)) {
  walkDirectory(targetDir);
} else {
  console.error(`❌ Directory not found: ${targetDir}`);
}
