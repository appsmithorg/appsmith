#! /usr/bin/env node

const yargs = require('yargs');
const utils = require('./utils');
const export_db = require('./export_db.js');
const import_db = require('./import_db.js');
const migrate = require('./migrate.js');

const APPLICATION_CONFIG_PATH = '/appsmith-stacks/configuration/docker.env';

// Loading latest application configuration
require('dotenv').config({ path: APPLICATION_CONFIG_PATH });

if (yargs.argv._[0] == 'export_db' || yargs.argv._[0] == 'ex') {
  console.log('Exporting database');
  export_db.runExportDatabase();
  console.log('Export database done');
  return;
}

if (yargs.argv._[0] == 'import_db' || yargs.argv._[0] == 'im') {
  console.log('Importing database');
  // Get Force option flag to run import DB immediately
  const forceOption = yargs.option('force', {
    alias: 'f',
    type: 'boolean',
    description: 'Force run import command'
  }).argv.force;
  import_db.runImportDatabase(forceOption);
  console.log('Importing database done');
  return;
}

if ((yargs.argv._[0] === 'migrate' || yargs.argv._[0] === 'mi') && yargs.argv._[1]) {
  const arrString = yargs.argv._[1].split('@');

  console.log('Start migrate instance');
  migrate.runMigrate(arrString[0], arrString[1]);
  return;
}

if (yargs.argv._[0] == null) {
  utils.showHelp();
  return;
}

utils.showHelp();
return;
