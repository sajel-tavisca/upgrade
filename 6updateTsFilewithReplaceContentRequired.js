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

          
 
          // Regular expression to find occurrences of 'AppConfig' not preceded by 'await'
          let regex = /(?<!await\s)AppConfig\(\)/g;
          let updatedData = data.replace(regex, '(await AppConfig())');

          // Regular expression to find import statements ending with .json'; or .json";
          regex = /import\s+.*?\.json(['"]);/g;
          updatedData = updatedData.replace(regex, (match, quote) => {
            return match.replace(quote + ';', `${quote} assert {type: "json"};`);
          });

          // Regular expression to find import statements ending with index
          // regex = /import\s+.*?\/index(['"]);/g;
          // updatedData = updatedData.replace(regex, (match, quote) => {
          //   return match.replace('index' + quote, `index.js` + quote);
          // });

          // Regular expression to find import statements ending with base.component
          // regex = /import\s+.*?\/base.component(['"]);/g;
          // updatedData = updatedData.replace(regex, (match, quote) => {
          //   return match.replace('base.component' + quote, `base.component.js` + quote);
          // });

          // Regular expression to find occurrences of '@orxe-test-automation/e2e'
          regex = /(['"])@orxe-test-automation\/e2e(?:\/lib)?\1/g;
          updatedData = updatedData.replace(regex, "'@orxe-test-automation/e2e/src/index.js'");

          // Regular expression to find occurrences of 'containerUtil.get' not preceded by 'await'
          regex = /(?<!await\s)containerUtil\.get/g;
          updatedData = updatedData.replace(regex, 'await containerUtil.get');

          // Regular expression to find occurrences of 'Helpers.getDataByLocale' not preceded by 'await'
          regex = /(?<!await\s)Helpers\.getDataByLocale/g;
          updatedData = updatedData.replace(regex, 'await Helpers.getDataByLocale');

          // Regular expression to find occurrences of 'LocaleHelper.getLocale' not preceded by 'await'
          regex = /(?<!await\s)LocaleHelper\.getLocale/g;
          updatedData = updatedData.replace(regex, 'await LocaleHelper.getLocale');

          // Regular expression to find occurrences of 'getCultureData' not preceded by 'await'
          regex = /(?<!\bawait\s*)\bgetCultureData\s*\(/g;
          updatedData = updatedData.replace(regex, 'await getCultureData(');

          // Regular expression to find occurrences of 'getTestData' not preceded by 'await'
          regex = /(?<!\bawait\s+)(?<!\bfunction\s+)\bgetTestData\b(?=\s*\()/g;
          updatedData = updatedData.replace(regex, 'await getTestData');

          // Regular expression to find occurrences of 'ChainablePromiseElement<Promise<WebdriverIO.Element>>'
          regex = /ChainablePromiseElement<Promise<WebdriverIO\.Element>>/g;
          updatedData = updatedData.replace(regex, 'ChainablePromiseElement<WebdriverIO.Element>');

          // Regular expression to find occurrences of 'Promise<Array<WebdriverIO.Element>>'
          regex = /Promise<Array<WebdriverIO\.Element>>/g;
          updatedData = updatedData.replace(regex, 'Promise<WebdriverIO.ElementArray>');
          
          // Regular expression to find occurrences of '= testCaseIds'
          regex = fs.readFileSync(filePath, 'utf8');
          updatedData = updatedData.replace(/= testCaseIds;/g, "= testCaseIds['default'];");

          // Regex matches:
          // import {ChainablePromiseElement} from 'webdriverio';
          // import{ ChainablePromiseElement }from'webdriverio'
          regex = /^import\s*{?\s*ChainablePromiseElement\s*}?\s*from\s*['"]webdriverio['"]\s*;?\s*$/gm;
          updatedData = updatedData.replace(regex, `import type { ChainablePromiseElement } from 'webdriverio';`);


 
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