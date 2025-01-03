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
     * Migrates the server schema of the given ArtifactExchangeJson by selecting the appropriate migration method.
     * This method may be overridden in the EE codebase for additional migration choices.
     *
     * @param artifactExchangeJson The artifact to be imported.
     * @param baseArtifactId       The base application ID to which it's being imported,
     *                             if it's a Git-connected artifact; otherwise, null.
     * @param branchName           The branch name of the artifact being imported,
     *                             if it's a Git-connected application; otherwise, null.
     */
    // TODO: add refType support
    public Mono<? extends ArtifactExchangeJson> migrateArtifactExchangeJsonToLatestSchema(
            ArtifactExchangeJson artifactExchangeJson, String baseArtifactId, String branchName) {

        if (ArtifactType.APPLICATION.equals(artifactExchangeJson.getArtifactJsonType())) {
            return migrateApplicationJsonToLatestSchema(
                    (ApplicationJson) artifactExchangeJson, baseArtifactId, branchName);
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
     * This method may be moved to the publisher chain itself
     *
     * @param applicationJson   : applicationJson which needs to be transformed
     * @param baseApplicationId : baseApplicationId of the application to which it's being imported,
     *                            if it's a git connected artifact, otherwise a null value would be passed.
     * @param branchName        : branch name of the artifact for which application json is getting imported
     *                            if it's a git connected application. Otherwise, the value would be null
     * @return : transformed applicationJson
     */
    private Mono<ApplicationJson> migrateServerSchema(
            ApplicationJson applicationJson, String baseApplicationId, String branchName) {
        Mono<ApplicationJson> migrateApplicationJsonMono = Mono.just(applicationJson);

        if (jsonSchemaVersions.getServerVersion().equals(applicationJson.getServerSchemaVersion())) {
            // No need to run server side migration
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
                // In Server version 9, there was a bug where the Embedded REST API datasource URL
                // was not being persisted correctly. Once the bug was fixed,
                // any previously uncommitted changes started appearing as uncommitted modifications
                // in the apps. To automatically commit these changes
                // (which were now appearing as uncommitted), a migration process was needed.
                // This migration fetches the datasource URL from the database
                // and serializes it in Git if the URL exists.
                // If the URL is missing, it copies the empty datasource configuration
                // if the configuration is present in the database.
                // Otherwise, it leaves the configuration unchanged.
                // Due to an update in the migration logic after version 10 was shipped,
                // the entire migration process was moved to version 11.
                // This adjustment ensures that the same operation can be
                // performed again for the changes introduced in version 10.
            case 9:
                applicationJson.setServerSchemaVersion(10);
            case 10:
                if (Boolean.TRUE.equals(MigrationHelperMethods.doesRestApiRequireMigration(applicationJson))) {
                    migrateApplicationJsonMono = migrateApplicationJsonMono.flatMap(
                            migratedJson -> jsonSchemaMigrationHelper.addDatasourceConfigurationToDefaultRestApiActions(
                                    baseApplicationId, branchName, migratedJson));
                }
                applicationJson.setServerSchemaVersion(11);
            default:
        }

        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        return migrateApplicationJsonMono;
    }
}
