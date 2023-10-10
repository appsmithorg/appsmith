package com.appsmith.server.cron.helpers.ce_compatible;

import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
public class BackupHelperCECompatibleImpl implements BackupHelperCECompatible {

    @Override
    public void takeBackup(Path backupPath) {
        // Do nothing
    }
}
