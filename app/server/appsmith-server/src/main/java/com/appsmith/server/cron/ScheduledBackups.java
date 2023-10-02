package com.appsmith.server.cron;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledBackups {

    private final TaskScheduler taskScheduler;

    @Value("${appsmith.backup-cron:}")
    private String cronExpression;

    private DateFormat dateFormat;

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

        if (!BACKUP_PATH.toFile().mkdirs()) {
            log.error("Unable to create backup logs directory");
            return;
        }

        dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

        taskScheduler.schedule(this::takeBackup, new CronTrigger(effectiveExpression));
    }

    public void takeBackup() {
        final File logFile =
                BACKUP_PATH.resolve(dateFormat.format(new Date()) + ".log").toFile();

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
