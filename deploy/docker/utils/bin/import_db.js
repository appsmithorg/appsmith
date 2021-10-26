// Init function export mongodb
const shell = require('shelljs')
const Constants = require('./constants')

function import_database() {
	console.log('import_database  ....')
	const cmd = `mongorestore --uri='${process.env.APPSMITH_MONGODB_URI}' --archive='${Constants.RESTORE_PATH}/${Constants.DUMP_FILE_NAME}' --gzip`
	shell.exec(cmd)
	console.log('import_database done')
}

function stop_application() {
	shell.exec('/usr/bin/supervisorctl stop backend rts')
}

function start_application() {
	shell.exec('/usr/bin/supervisorctl start backend rts')
}

// Main application workflow
function main() {
	let errorCode = 0
	try {
		check_supervisord_status_cmd = '/usr/bin/supervisorctl'
		shell.exec(check_supervisord_status_cmd, function (code) {
			if (code > 0) {
				shell.echo('application is not running, starting supervisord')
				shell.exec('/usr/bin/supervisord')
			}
		})

		shell.echo('stop backend & rts application before import database')
		stop_application()
		import_database()
		shell.echo('start backend & rts application after import database')
	} catch (err) {
		shell.echo(err)
		errorCode = 1
	} finally {
		start_application();
		process.exit(errorCode);
	}
}

module.exports = {
	runImportDatabase: main
};
