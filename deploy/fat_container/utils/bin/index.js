#! /usr/bin/env node

const utils = require('./utils.js')
const export_db = require('./export_db.js')
const import_db = require('./import_db.js')
const yargs = require("yargs");

const APPLICATION_CONFIG_PATH='/opt/appsmith/configuration/docker.env'

// Loading latest application configuration
require('dotenv').config(
  { path: APPLICATION_CONFIG_PATH }
)

console.log(process.env.APPSMITH_MONGODB_URI);
if(yargs.argv._[0] == 'export_db' || yargs.argv._[0] == 'ex'){
    console.log('Exporting database')
    export_db.runExportDatabase();
    console.log('Export database done')
    return;
}

if(yargs.argv._[0] == 'import_db' || yargs.argv._[0] == 'im'){
  console.log('Importing database')
  import_db.runImportDatabase();
  console.log('Importing database done')
  return;
}

if(yargs.argv._[0] == null){
    utils.showHelp();
    return;
}
utils.showHelp();
return;