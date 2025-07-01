const fs = require('fs');
const path = require('path');

const repoRoot = 'C:/work/orxe-core-ui/components';

// Get all first-level folders in the repo
const firstLevelFolders = fs.readdirSync(repoRoot, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Loop through each folder and check for a 'test' folder inside it
firstLevelFolders.forEach(folder => {
  const innerTestPath = path.join(repoRoot, folder, 'tests');

  if (fs.existsSync(innerTestPath) && fs.lstatSync(innerTestPath).isDirectory()) {
    
  } else {
    console.log(`${folder}`);
  }
});
