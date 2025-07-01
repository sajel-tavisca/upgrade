const fs = require('fs');
const path = require('path');
const argv = require('./arguments');


const targetDir = argv.dir // ✅ Change to your folder

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');

  const interfaceRegex = /export\s+interface\s+(\w+)/g;
  let match;
  const interfaceNames = [];

  // Remove "export" and collect interface names
  let updatedContent = content.replace(interfaceRegex, (_, name) => {
    interfaceNames.push(name);
    return `interface ${name}`;
  });

  if (interfaceNames.length > 0) {
    // Append export type { ... } at end
    updatedContent += `\n\nexport type { ${interfaceNames.join(', ')} };`;

    fs.writeFileSync(filePath, updatedContent, 'utf8');
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
      processFile(fullPath);
    }
  }
}

// 🔁 Start
if (fs.existsSync(targetDir)) {
  walkDirectory(targetDir);
} else {
  console.error(`❌ Directory not found: ${targetDir}`);
}
