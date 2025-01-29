package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.OrganizationConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "021", id = "move-google-maps-key-to-tenant-configuration")
public class Migration021MoveGoogleMapsKeyToTenantConfiguration {
    private final MongoTemplate mongoTemplate;
    private final CommonConfig commonConfig;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() throws IOException {
        final String envName = "APPSMITH_GOOGLE_MAPS_API_KEY";
        final String mapsEnvValue = System.getenv(envName);
        if (StringUtils.isNotEmpty(mapsEnvValue)) {
            mongoTemplate.updateFirst(
                    new Query(where("slug").is("default")),
                    new Update().set("tenantConfiguration.googleMapsKey", mapsEnvValue),
                    OrganizationConfiguration.class);
            commentEnvInFile(envName, commonConfig.getEnvFilePath());
        }
    }

    public static void commentEnvInFile(final String envName, final String envPathString) throws IOException {
        if (StringUtils.isEmpty(envPathString)) {
            return;
        }

        final Path envPath = Path.of(envPathString);

        final String updatedLines = Files.readAllLines(envPath).stream()
                .map(line -> {
                    if (line.startsWith(envName + "=")) {
                        return "#" + envName + "=  (use Admin Settings UI to configure this)";
                    }
                    return line;
                })
                .collect(Collectors.joining("\n"));
        Files.writeString(envPath, updatedLines);
    }
}
