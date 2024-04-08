package com.appsmith.server.migrations;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;

public class ArtifactSchemaMigrationCE {

    private static boolean checkCompatibility(ArtifactExchangeJson artifactExchangeJson) {
        return (artifactExchangeJson.getClientSchemaVersion() <= JsonSchemaVersions.clientVersion)
                && (artifactExchangeJson.getServerSchemaVersion() <= JsonSchemaVersions.serverVersion);
    }

    public static ArtifactExchangeJson migrateArtifactExchangeJsonToLatestSchema(
            ArtifactExchangeJson artifactExchangeJson) {
        // Check if the schema versions are available and set to initial version if not present
        Integer serverSchemaVersion = artifactExchangeJson.getServerSchemaVersion() == null
                ? 0
                : artifactExchangeJson.getServerSchemaVersion();
        Integer clientSchemaVersion = artifactExchangeJson.getClientSchemaVersion() == null
                ? 0
                : artifactExchangeJson.getClientSchemaVersion();

        artifactExchangeJson.setClientSchemaVersion(clientSchemaVersion);
        artifactExchangeJson.setServerSchemaVersion(serverSchemaVersion);
        if (!checkCompatibility(artifactExchangeJson)) {
            throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
        }

        migrateClientAndServerSchemas(artifactExchangeJson);
        return artifactExchangeJson;
    }

    /**
     * This method migrates the client & server schema of artifactExchangeJson after choosing the right method for migration
     * this will likely be overridden in EE codebase for more choices
     * @param artifactExchangeJson artifactExchangeJson which is imported
     */
    private static void migrateClientAndServerSchemas(ArtifactExchangeJson artifactExchangeJson) {
        if (ArtifactType.APPLICATION.equals(artifactExchangeJson.getArtifactJsonType())) {
            migrateApplicationJsonClientSchema((ApplicationJson) artifactExchangeJson);
            migrateApplicationJsonServerSchema((ApplicationJson) artifactExchangeJson);
        }
    }

    private static ApplicationJson migrateApplicationJsonServerSchema(ApplicationJson applicationJson) {
        if (JsonSchemaVersions.serverVersion.equals(applicationJson.getServerSchemaVersion())) {
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
        return applicationJson;
    }

    private static ApplicationJson migrateApplicationJsonClientSchema(ApplicationJson applicationJson) {
        if (JsonSchemaVersions.clientVersion.equals(applicationJson.getClientSchemaVersion())) {
            // No need to run client side migration
            return applicationJson;
        }
        // Today server is not responsible to run the client side DSL migration but this can be useful if we start
        // supporting this on server side
        return applicationJson;
    }
}
