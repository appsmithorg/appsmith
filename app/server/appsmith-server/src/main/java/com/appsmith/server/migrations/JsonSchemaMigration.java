package com.appsmith.server.migrations;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.utils.JsonSchemaMigrationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class JsonSchemaMigration {

    private final JsonSchemaVersions jsonSchemaVersions;
    private final JsonSchemaMigrationHelper jsonSchemaMigrationHelper;

    private boolean isCompatible(ApplicationJson applicationJson) {
        return (applicationJson.getClientSchemaVersion() <= jsonSchemaVersions.getClientVersion())
                && (applicationJson.getServerSchemaVersion() <= jsonSchemaVersions.getServerVersion());
    }

    private void setSchemaVersions(ApplicationJson applicationJson) {
        applicationJson.setServerSchemaVersion(getCorrectSchemaVersion(applicationJson.getServerSchemaVersion()));
        applicationJson.setClientSchemaVersion(getCorrectSchemaVersion(applicationJson.getClientSchemaVersion()));
    }

    private Integer getCorrectSchemaVersion(Integer schemaVersion) {
        return schemaVersion == null ? 0 : schemaVersion;
    }

    /**
     * This method migrates the server schema of artifactExchangeJson after choosing the right method for migration
     * this will likely be overridden in EE codebase for more choices
     * @param artifactExchangeJson artifactExchangeJson which is imported
     */
    public Mono<? extends ArtifactExchangeJson> migrateArtifactExchangeJsonToLatestSchema(
            ArtifactExchangeJson artifactExchangeJson) {

        if (ArtifactType.APPLICATION.equals(artifactExchangeJson.getArtifactJsonType())) {
            return migrateApplicationJsonToLatestSchema((ApplicationJson) artifactExchangeJson, null, null);
        }

        return Mono.fromCallable(() -> artifactExchangeJson);
    }

    public Mono<ApplicationJson> migrateApplicationJsonToLatestSchema(
            ApplicationJson applicationJson, String baseApplicationId, String branchName) {
        return Mono.fromCallable(() -> {
                    setSchemaVersions(applicationJson);
                    return applicationJson;
                })
                .flatMap(appJson -> {
                    if (!isCompatible(appJson)) {
                        return Mono.empty();
                    }

                    return migrateServerSchema(applicationJson, baseApplicationId, branchName);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON)));
    }

    /**
     * Migrates ApplicationJson to latest schema.
     * @param applicationJson : Application json for which migration is to be performed
     * @param baseApplicationId : base applicationId
     * @param branchName : branch name in case it is a git connected application.
     * @return : A publisher of migrated json
     */
    private Mono<ApplicationJson> migrateServerSchema(ApplicationJson applicationJson, String baseApplicationId, String branchName) {
        Mono<ApplicationJson> migrateApplicationJsonMono = Mono.just(applicationJson);
        // No need to run server side migration
        if (jsonSchemaVersions.getServerVersion().equals(applicationJson.getServerSchemaVersion())) {
            return migrateApplicationJsonMono;
        }

        // Run migration linearly
        // Updating the schema version after each migration is not required as we are not exiting by breaking the switch
        // cases, but this keeps the version number and the migration in sync
        switch (applicationJson.getServerSchemaVersion()) {
            case 0:
            case 1:
                // Migration for deprecating archivedAt field in ActionDTO
                if (!CollectionUtils.isNullOrEmpty(applicationJson.getActionList())) {
                    MigrationHelperMethods.updateArchivedAtByDeletedATForActions(applicationJson.getActionList());
                }
                applicationJson.setServerSchemaVersion(2);
            case 2:
                // Migration for converting formData elements to one that supports viewType
                MigrationHelperMethods.migrateActionFormDataToObject(applicationJson);
                applicationJson.setServerSchemaVersion(3);
            case 3:
                // File structure migration to update git directory structure
                applicationJson.setServerSchemaVersion(4);
            case 4:
                // Remove unwanted fields from DTO and allow serialization for JsonIgnore fields
                if (!CollectionUtils.isNullOrEmpty(applicationJson.getPageList())
                    && applicationJson.getExportedApplication() != null) {
                    MigrationHelperMethods.arrangeApplicationPagesAsPerImportedPageOrder(applicationJson);
                    MigrationHelperMethods.updateMongoEscapedWidget(applicationJson);
                }
                if (!CollectionUtils.isNullOrEmpty(applicationJson.getActionList())) {
                    MigrationHelperMethods.updateUserSetOnLoadAction(applicationJson);
                }
                applicationJson.setServerSchemaVersion(5);
            case 5:
                MigrationHelperMethods.migrateGoogleSheetsActionsToUqi(applicationJson);
                applicationJson.setServerSchemaVersion(6);
            case 6:
                MigrationHelperMethods.ensureXmlParserPresenceInCustomJsLibList(applicationJson);
                applicationJson.setServerSchemaVersion(7);
            case 7:
                applicationJson.setServerSchemaVersion(8);
            case 8:
                MigrationHelperMethods.migrateThemeSettingsForAnvil(applicationJson);
                applicationJson.setServerSchemaVersion(9);
            case 9:
                if (Boolean.TRUE.equals(MigrationHelperMethods.doesRestApiRequireMigration(applicationJson))) {
                    migrateApplicationJsonMono = migrateApplicationJsonMono
                        .flatMap(migratedJson -> jsonSchemaMigrationHelper
                            .addDatasourceConfigurationToDefaultRestApiActions(baseApplicationId, branchName, migratedJson));
                }
                applicationJson.setServerSchemaVersion(10);
                // Moving forward all case implementation should be wrapped in the Mono even if they are non reactive
                // code in order to perform linear migrations.
            default:
        }

        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        return migrateApplicationJsonMono;
    }
}
