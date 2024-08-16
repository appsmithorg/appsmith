
const BACKUP_PATH = "/appsmith-stacks/data/backup"

const RESTORE_PATH = "/appsmith-stacks/data/restore"

const DUMP_FILE_NAME = "appsmith-data.archive"

const APPSMITHCTL_LOG_PATH = "/appsmith-stacks/logs/appsmithctl"

const LAST_ERROR_MAIL_TS = "/appsmith-stacks/data/backup/last-error-mail-ts"

const ENV_PATH = "/appsmith-stacks/configuration/docker.env"

const MIN_REQUIRED_DISK_SPACE_IN_BYTES = 2147483648 // 2GB

const DURATION_BETWEEN_BACKUP_ERROR_MAILS_IN_MILLI_SEC = 21600000 // 6 hrs

const APPSMITH_DEFAULT_BACKUP_ARCHIVE_LIMIT = 4 // 4 backup archives

module.exports = {
    BACKUP_PATH,
    RESTORE_PATH,
    DUMP_FILE_NAME,
    LAST_ERROR_MAIL_TS,
    APPSMITHCTL_LOG_PATH,
    MIN_REQUIRED_DISK_SPACE_IN_BYTES,
    DURATION_BETWEEN_BACKUP_ERROR_MAILS_IN_MILLI_SEC,
    APPSMITH_DEFAULT_BACKUP_ARCHIVE_LIMIT,
    ENV_PATH
}