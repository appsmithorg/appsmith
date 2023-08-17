package com.appsmith.server.cron;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.io.IOException;

@Slf4j
public class CleanUpOldLogs {

    @Scheduled(cron = "0 0 * * SUN")
    public void cleanUpOldLogs() throws IOException {
        log.info("Cleaning up old logs");
        Runtime.getRuntime().exec(new String[] {
            "find",
            "/appsmith-stacks/logs/backend",
            "/appsmith-stacks/logs/rts/",
            "/appsmith-stacks/logs/editor/",
            "-name",
            "*.log*",
            "-type",
            "f",
            "-mtime",
            "+7",
            "-delete",
        });
    }
}
