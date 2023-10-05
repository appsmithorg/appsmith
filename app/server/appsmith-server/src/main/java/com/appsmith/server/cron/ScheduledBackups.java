package com.appsmith.server.cron;

import com.appsmith.server.cron.helpers.BackupHelper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledBackups {

    private final TaskScheduler taskScheduler;

    private final BackupHelper backupHelper;

    @Value("${appsmith.backup-cron:}")
    private String cronExpression;

    private static final Path BACKUP_PATH = Path.of("/appsmith-stacks/logs/appsmithctl/backup");

    @PostConstruct
    public void scheduleBackups() {
        if ("disable".equals(cronExpression)) {
            return;
        }

        String effectiveExpression = cronExpression;

        if (StringUtils.isEmpty(effectiveExpression)) {
            // Default to midnight every day.
            effectiveExpression = "0 0 0 * * *";
        } else if (effectiveExpression.split(" ").length == 5) {
            // If the cron expression is missing the seconds field, add it.
            // This is because Spring's CronTrigger requires the seconds field, but the Ubuntu cron utility does not.
            effectiveExpression = "0 " + effectiveExpression;
        }

        // Create the backup logs directory if it doesn't exist.
        if (!BACKUP_PATH.toFile().exists() && !BACKUP_PATH.toFile().mkdirs()) {
            log.error("Unable to create backup logs directory");
            return;
        }

        taskScheduler.schedule(() -> backupHelper.takeBackup(BACKUP_PATH), new CronTrigger(effectiveExpression));
    }
}
