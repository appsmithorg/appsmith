package com.appsmith.server.cron.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.cron.helpers.ce_compatible.BackupHelperCECompatibleImpl;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

@Component
@Slf4j
public class BackupHelperImpl extends BackupHelperCECompatibleImpl implements BackupHelper {

    private DateFormat dateFormat;

    @PostConstruct
    public void backupInitializer() {
        dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scheduled_backup_enabled)
    public void takeBackup(Path backupPath) {
        final File logFile =
                backupPath.resolve(dateFormat.format(new Date()) + ".log").toFile();

        try {
            new ProcessBuilder()
                    .command("appsmithctl", "backup", "--upload-to-s3")
                    .redirectErrorStream(true)
                    .redirectOutput(logFile)
                    .start();
        } catch (IOException e) {
            log.error("Failed to take backup", e);
        }
    }
}
