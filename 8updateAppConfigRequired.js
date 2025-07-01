const fs    = require('fs');
const path  = require('path');
const fg    = require('fast-glob');          // handles globs for us
const argv = require('./arguments');


// const ROOT = path.resolve(process.cwd(), argv.dir);

// ✅ Path to the file you want to replace
const targetFile = path.join(argv.dir, '/functional/config/app-config/index.ts');

// ✅ Path to the new version of the file
const sourceFile = path.join(__dirname, 'appconf.txt');

try {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  // Check if target file exists
  if (!fs.existsSync(targetFile)) {
    console.warn(`Target file not found: ${targetFile}. Creating it.`);
  }

  // Read the new file content
  const data = fs.readFileSync(sourceFile);

  // Overwrite the target file
  fs.writeFileSync(targetFile, data);

  console.log(`✅ File successfully overridden at: ${targetFile}`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
