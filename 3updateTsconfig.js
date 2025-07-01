const fs = require('fs');
const path = require('path');
const argv = require('./arguments');
 
function updateTsConfig(filePath) {
  const tsConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
 
  // Update compilerOptions
  if (!tsConfig.compilerOptions) {
    tsConfig.compilerOptions = {};
  }
 
  tsConfig.compilerOptions.module = 'ESNext';
  tsConfig.compilerOptions.target = 'ESNext';
 
  if (tsConfig.compilerOptions.types) {
    tsConfig.compilerOptions.types = tsConfig.compilerOptions.types.map(type =>
      type === 'webdriverio/async' || type === 'webdriverio/async' ? '@wdio/globals/types' : type
    );
    tsConfig.compilerOptions.types.push("wdio-intercept-service");
  }
 
  tsConfig.compilerOptions.esModuleInterop = true;
  tsConfig.compilerOptions.skipLibCheck = true;
  tsConfig.compilerOptions.isolatedModules = true;
 
  // Add ts-node configuration
  if (!tsConfig['ts-node']) {
    tsConfig['ts-node'] = {
      skipIgnore: true,
      experimentalSpecifierResolution: 'explicit',
      transpileOnly: true,
      experimentalResolver: true
    };
  }
 
  fs.writeFileSync(filePath, JSON.stringify(tsConfig, null, 2), 'utf8');
  console.log(`Updated: ${filePath}`);
}
 
function findTsConfigFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTsConfigFiles(fullPath);
    } else if (file === 'tsconfig.functional.json') {
      updateTsConfig(fullPath);
    }
  }
}
 
// Start from the root directory of the repository
const rootDir = path.resolve(__dirname, argv.dir); // Adjust this if needed
findTsConfigFiles(rootDir);