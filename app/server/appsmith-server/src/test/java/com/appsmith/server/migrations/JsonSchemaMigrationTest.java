package com.appsmith.server.migrations;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.server.dtos.ApplicationJson;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class JsonSchemaMigrationTest {

    @Test
    public void migrateApplicationToLatestSchema_WhenModifiedResourcesNotPresent_MigratedToJsonSchema() {
        ApplicationJson applicationJson = new ApplicationJson();
        applicationJson.setServerSchemaVersion(7);
        applicationJson.setUpdatedResources(Map.of("PAGES", Set.of("home", "login"), "ACTIONS", Set.of("getData")));

        JsonSchemaMigration.migrateApplicationToLatestSchema(applicationJson);

        // updatedResources should be set to null after the migration
        assertThat(applicationJson.getUpdatedResources()).isNull();
        // should be migrated to latest version from version 7
        assertThat(applicationJson.getServerSchemaVersion()).isEqualTo(JsonSchemaVersions.serverVersion);

        ModifiedResources modifiedResources = applicationJson.getModifiedResources();
        assertThat(modifiedResources).isNotNull();
        assertThat(modifiedResources.isAllModified()).isFalse();
        assertThat(modifiedResources.getModifiedResourceMap().size()).isEqualTo(2);
        assertThat(modifiedResources.getModifiedResourceMap().get("PAGES").size())
                .isEqualTo(2);
        assertThat(modifiedResources.getModifiedResourceMap().get("PAGES")).contains("home", "login");

        assertThat(modifiedResources.getModifiedResourceMap().get("ACTIONS").size())
                .isEqualTo(1);
        assertThat(modifiedResources.getModifiedResourceMap().get("ACTIONS")).contains("getData");
    }
}
