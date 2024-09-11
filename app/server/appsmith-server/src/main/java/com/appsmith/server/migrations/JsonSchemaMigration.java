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

import java.util.Map;

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

                    // Taking a tech debt over here for import of file application.
                    // All migration above version 9 is reactive
                    // TODO: make import flow migration reactive
                    return Mono.just(migrateServerSchema(appJson))
                            .flatMap(migratedApplicationJson -> {
                                if (migratedApplicationJson.getServerSchemaVersion() == 9) {
                                    migratedApplicationJson.setServerSchemaVersion(10);
                                }

                                if (migratedApplicationJson.getServerSchemaVersion() == 10) {
                                    if (Boolean.TRUE.equals(MigrationHelperMethods.doesRestApiRequireMigration(
                                            migratedApplicationJson))) {
                                        return jsonSchemaMigrationHelper
                                                .addDatasourceConfigurationToDefaultRestApiActions(
                                                        baseApplicationId, branchName, migratedApplicationJson);
                                    }

                                    migratedApplicationJson.setServerSchemaVersion(11);
                                }

                                return Mono.just(migratedApplicationJson);
                            })
                            .map(migratedAppJson -> {
                                applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
                                return applicationJson;
                            });
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON)));
    }

    /**
     * migrate artifacts to latest schema by adding the right DTOs, or any migration.
     * This method would be deprecated soon enough
     * @param artifactExchangeJson : the json to be imported
     * @return transformed artifact exchange json
     */
    @Deprecated(forRemoval = true, since = "Use migrateArtifactJsonToLatestSchema")
    public ArtifactExchangeJson migrateArtifactToLatestSchema(ArtifactExchangeJson artifactExchangeJson) {

        if (!ArtifactType.APPLICATION.equals(artifactExchangeJson.getArtifactJsonType())) {
            return artifactExchangeJson;
        }

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        setSchemaVersions(applicationJson);
        if (!isCompatible(applicationJson)) {
            throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
        }

        applicationJson = migrateServerSchema(applicationJson);
        return nonReactiveServerMigrationForImport(applicationJson);
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
            case 7:
                applicationJson.setServerSchemaVersion(8);
            case 8:
                MigrationHelperMethods.migrateThemeSettingsForAnvil(applicationJson);
                applicationJson.setServerSchemaVersion(9);

                // This is not supposed to have anymore additions to the schema.
            default:
                // Unable to detect the serverSchema

        }

        return applicationJson;
    }

    /**
     * This method is an alternative to reactive way of adding migrations to application json.
     * this is getting used by flows which haven't implemented the reactive way yet.
     * @param applicationJson : application json for which migration has to be done.
     * @return return application json after migration
     */
    private ApplicationJson nonReactiveServerMigrationForImport(ApplicationJson applicationJson) {
        if (jsonSchemaVersions.getServerVersion().equals(applicationJson.getServerSchemaVersion())) {
            return applicationJson;
        }

        switch (applicationJson.getServerSchemaVersion()) {
            case 9:
                applicationJson.setServerSchemaVersion(10);
            case 10:
                // this if for cases where we have empty datasource configs
                MigrationHelperMethods.migrateApplicationJsonToVersionTen(applicationJson, Map.of());
                applicationJson.setServerSchemaVersion(11);
            default:
        }

        applicationJson.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());
        return applicationJson;
    }
}
