const fs = require('fs');
const path = require('path');
const argv = require('./arguments');

 
// Function to recursively find and update TypeScript files
function updateTsFiles(directory) {
  fs.readdir(directory, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${directory}:`, err);
      return;
    }
 
    files.forEach(file => {
      const filePath = path.join(directory, file.name);
 
      if (file.isDirectory()) {
        // Recursively process subdirectories
        updateTsFiles(filePath);
      } else if (file.isFile() && file.name.endsWith('.ts')) {
        // Process TypeScript files
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
          }

          // Regular expression to find occurrences of '@orxe-test-automation/e2e'
          let regex = /(['"])@orxe-test-automation\/e2e(?:\/lib)?\1/g;
          let updatedData = data.replace(regex, "'@orxe-test-automation/e2e/src/index.js'");

 
          fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
              console.error(`Error writing file ${filePath}:`, err);
            } else {
              console.log(`Updated file: ${filePath}`);
            }
          });
        });
      }
    });
  });
}
 
// Replace 'path/to/test/folder' with the actual path to the test folder
const testFolderPath = argv.dir;
 
updateTsFiles(testFolderPath);