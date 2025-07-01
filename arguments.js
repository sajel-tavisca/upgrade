const yargs  = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

/* ------------------ CLI --------------------------------------- */
const argv = yargs(hideBin(process.argv))
  .option('dir',      { alias: 'd', demandOption: true, type: 'string',
                        describe: 'Folder with .ts/.tsx files to process' })
  .help().argv;

module.exports = argv;