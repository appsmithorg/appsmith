package com.appsmith.server.cron.helpers.ce_compatible;

import java.nio.file.Path;

public interface BackupHelperCECompatible {
    void takeBackup(Path backupPath);
}
