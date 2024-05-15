package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.configurations.CommonConfig;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "056", id = "update-db-uri-env-variable")
public class Migration056UpdateDbUriEnvVariable {
    private final CommonConfig commonConfig;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() throws IOException {
        final String currentEnvName = "APPSMITH_MONGODB_URI";
        final String updatedEnvName = "APPSMITH_DB_URI";
        updateEnvInFile(currentEnvName, updatedEnvName, commonConfig.getEnvFilePath());
    }

    private static void updateEnvInFile(
            final String currentEnvName, final String updatedEnvName, final String envPathString) {
        if (StringUtils.isEmpty(envPathString) || StringUtils.isEmpty(updatedEnvName)) {
            return;
        }

        final Path envPath = Path.of(envPathString);
        try {
            final String updatedLines = Files.readAllLines(envPath).stream()
                    .map(line -> {
                        if (line.startsWith(currentEnvName + "=")) {
                            return updatedEnvName + "=" + System.getenv(currentEnvName);
                        }
                        return line;
                    })
                    .collect(Collectors.joining("\n"));
            Files.writeString(envPath, updatedLines);
        } catch (IOException e) {
            log.error("Error updating the DB URI environment variable in the file at path {}", envPath, e);
        }
    }
}
