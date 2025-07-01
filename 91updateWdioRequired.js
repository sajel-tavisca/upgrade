const fs = require('fs');
const path = require('path');
const argv = require('./arguments');

// Define what to remove
const patternsToRemove = [
  /^\s*(\/\/\s*)?require:\s*['"]ts-node\/register['"],?\s*$/gm,
  /^\s*(\/\/\s*)?compilers:\s*\[\s*['"]tsconfig-paths\/register['"]\s*\],?\s*$/gm,
  /onComplete:\s*function\s*\(exitCode, config, capabilities, results\)\s*\{[^}]*?console\.log\('=== Inside wdio\.config\.js onComplete hook'\);[\s\S]*?onCompletePubSub\.publish\(exitCode, config, capabilities, results\);\s*\},?/gm
];

// Function to recursively walk through directories
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (stat.isFile() && path.extname(filepath) === '.js') {
      callback(filepath);
    }
  });
}

// Function to clean a file
function cleanFile(filepath) {
  let originalContent = fs.readFileSync(filepath, 'utf8');
  let modifiedContent = originalContent;

  patternsToRemove.forEach(pattern => {
    modifiedContent = modifiedContent.replace(pattern, '');
  });

  // Update exports.config to export const config
  const exportRegex = /exports\.config\s*=/g;
  modifiedContent = modifiedContent.replace(exportRegex, 'export const config =');

  if (modifiedContent !== originalContent) {
    fs.writeFileSync(filepath, modifiedContent.trim() + '\n', 'utf8');
    console.log(`Cleaned: ${filepath}`);
  }
}

// Run the script
const targetDir = path.resolve(argv.dir); // Change if needed
walk(targetDir, cleanFile);
