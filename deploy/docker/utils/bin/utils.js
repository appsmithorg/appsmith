module.exports = { showHelp: showHelp };

function showHelp() {
  console.log('\nUsage: appsmith <command> to interactive with appsmith utils tool');
  console.log('\nOptions:\r');
  console.log('\tex, export_db\t\tExport interal database.\r');
  console.log('\tim, import_db\t\tImport interal database.\r');
  console.log('\tmi, migrate\t\tMigrate new server.\r');
  console.log('\tcrs, check_replica_set\t\tcheck replica set mongoDB.\r');
  console.log('\t--help\t\t\t' + 'Show help.' + '\t\t\t' + '[boolean]\n');
}
