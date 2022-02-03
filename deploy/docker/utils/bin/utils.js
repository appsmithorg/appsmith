const chalk = require('chalk');
const usage = chalk.hex('#83aaff')('\nUsage: appsmith <command> to interactive with appsmith utils toool');
module.exports = { showHelp: showHelp };

function showHelp() {
  console.log(usage);
  console.log('\nOptions:\r');
  console.log('\tex, export_db\t\tExport interal database.\r');
  console.log('\tim, import_db\t\tImport interal database.\r');
  console.log('\tmi, migrate\t\tMigrate new server.\r');
  console.log('\t--help\t\t\t' + 'Show help.' + '\t\t\t' + '[boolean]\n');
}
