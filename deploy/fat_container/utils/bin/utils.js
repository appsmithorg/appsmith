const chalk = require('chalk')
const usage = chalk.hex('#83aaff')("\nUsage: appsmith <command> to interactive with appsmith utils toool");
module.exports = {showHelp: showHelp};



function showHelp() {
    console.log(usage);
    console.log('\nOptions:\r')
    console.log('\t-ex, --export-db\tExport interal database.\r')
    console.log('\t-im, --import-db\Import interal database.\r')
    console.log('\t--help\t\t\t'+ 'Show help.' + '\t\t\t' + '[boolean]\n')
}

