package com.appsmith.server.migrations;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class JsonSchemaMigration {

    private final JsonSchemaVersions jsonSchemaVersions;

    private boolean isCompatible(ApplicationJson applicationJson) {
        return (applicationJson.getClientSchemaVersion() <= jsonSchemaVersions.getClientVersion())
                && (applicationJson.getServerSchemaVersion() <= jsonSchemaVersions.getServerVersion());
    }

    /**
     * This is a temporary check which is being placed for the compatibility of server versions in scenarios
     * where user is moving a json from an instance which has
     * release_autocommit_feature_enabled true to an instance which has the flag as false. In that case the server
     * version number of json would be 8 and in new instance it would be not compatible.
     * @param applicationJson
     * @return
     */
    private boolean isAutocommitVersionBump(ApplicationJson applicationJson) {
        return jsonSchemaVersions.getServerVersion() == 7 && applicationJson.getServerSchemaVersion() == 8;
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
            return migrateApplicationJsonToLatestSchema((ApplicationJson) artifactExchangeJson);
        }

        return Mono.fromCallable(() -> artifactExchangeJson);
    }

    public Mono<ApplicationJson> migrateApplicationJsonToLatestSchema(ApplicationJson applicationJson) {
        return Mono.fromCallable(() -> {
                    setSchemaVersions(applicationJson);
                    if (isCompatible(applicationJson)) {
                        return migrateServerSchema(applicationJson);
                    }

                    if (isAutocommitVersionBump(applicationJson)) {
                        return migrateServerSchema(applicationJson);
                    }

                    return null;
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON)));
    }

    /**
     * migrate artifacts to latest schema by adding the right DTOs, or any migration.
     * This method would be deprecated soon enough
     * @param artifactExchangeJson : the json to be imported
     * @return transformed artifact exchange json
     */
    @Deprecated
    public ArtifactExchangeJson migrateArtifactToLatestSchema(ArtifactExchangeJson artifactExchangeJson) {

        if (!ArtifactType.APPLICATION.equals(artifactExchangeJson.getArtifactJsonType())) {
            return artifactExchangeJson;
        }

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        setSchemaVersions(applicationJson);
        if (!isCompatible(applicationJson)) {
            if (!isAutocommitVersionBump(applicationJson)) {
                throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
            }
        }
        return migrateServerSchema(applicationJson);
    }

    /**
     * This method may be moved to the publisher chain itself
     * @param applicationJson : applicationJson which needs to be transformed
     * @return : transformed applicationJson
     */
    private ApplicationJson migrateServerSchema(ApplicationJson applicationJson) {
        if (jsonSchemaVersions.getServerVersion().equals(applicationJson.getServerSchemaVersion())) {
            // No need to run server side migration
            return applicationJson;
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
            default:
                // Unable to detect the serverSchema
        }

        if (applicationJson.getServerSchemaVersion().equals(jsonSchemaVersions.getServerVersion())) {
            return applicationJson;
        }

        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        return applicationJson;
    }
}
