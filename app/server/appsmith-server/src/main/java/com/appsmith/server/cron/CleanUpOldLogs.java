package com.appsmith.server.cron;

import io.micrometer.observation.annotation.Observed;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

@Slf4j
@Component
public class CleanUpOldLogs {

    private static final int CUTOFF_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

    @Scheduled(cron = "0 0 0 * * SAT")
    @Observed(name = "cleanUpOldLogs")
    public void cleanUpOldLogs() throws IOException {
        log.info("Cleaning up old logs");

        final long cutoffTime = System.currentTimeMillis() - CUTOFF_AGE;

        try (Stream<Path> walk = Files.walk(Paths.get(System.getenv("APPSMITH_LOG_DIR")))) {
            walk.filter(path -> {
                        try {
                            return Files.isRegularFile(path)
                                    && path.getFileName().toString().contains(".log")
                                    && Files.getLastModifiedTime(path).toMillis() < cutoffTime;
                        } catch (IOException e) {
                            log.error("Failed to get last modified time for file {}", path, e);
                        }
                        return false;
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            log.error("Failed to delete old log file {}", path, e);
                        }
                    });
        }
    }
}
