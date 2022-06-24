
const BACKUP_PATH = "/appsmith-stacks/data/backup"

const RESTORE_PATH = "/appsmith-stacks/data/restore"

const DUMP_FILE_NAME = "appsmith-data.archive"

const BACKUP_ERROR_LOG_PATH = '/appsmith-stacks/logs/backup'

const MIN_REQUIRED_DISK_SPACE_IN_BYTES = 5368709120 // 5GB

module.exports = {
    BACKUP_PATH,
    RESTORE_PATH,
    DUMP_FILE_NAME,
    BACKUP_ERROR_LOG_PATH,
    MIN_REQUIRED_DISK_SPACE_IN_BYTES
}
