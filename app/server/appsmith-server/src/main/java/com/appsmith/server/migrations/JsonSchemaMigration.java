package com.appsmith.server.migrations;

import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;

public class JsonSchemaMigration {
    private static boolean checkCompatibility(ApplicationJson applicationJson) {
        return (applicationJson.getClientSchemaVersion() <= JsonSchemaVersions.clientVersion)
                && (applicationJson.getServerSchemaVersion() <= JsonSchemaVersions.serverVersion);
    }

    public static ApplicationJson migrateApplicationToLatestSchema(ApplicationJson applicationJson) {
        // Check if the schema versions are available and set to initial version if not present
        Integer serverSchemaVersion = applicationJson.getServerSchemaVersion() == null ? 0 : applicationJson.getServerSchemaVersion();
        Integer clientSchemaVersion = applicationJson.getClientSchemaVersion() == null ? 0 : applicationJson.getClientSchemaVersion();

        applicationJson.setClientSchemaVersion(clientSchemaVersion);
        applicationJson.setServerSchemaVersion(serverSchemaVersion);
        if (!checkCompatibility(applicationJson)) {
            throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
        }
        migrateServerSchema(applicationJson);
        migrateClientSchema(applicationJson);
        return applicationJson;
    }

    private static ApplicationJson migrateServerSchema(ApplicationJson applicationJson) {
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
                    HelperMethods.updateArchivedAtByDeletedATForActions(applicationJson.getActionList());
                }
                applicationJson.setServerSchemaVersion(2);
            case 2:
                // Migration for converting formData elements to one that supports viewType
                HelperMethods.migrateActionFormDataToObject(applicationJson);
                applicationJson.setServerSchemaVersion(3);
            case 3:
                // File structure migration to update git directory structure
                applicationJson.setServerSchemaVersion(4);
            default:
                // Unable to detect the serverSchema
        }
        return applicationJson;
    }

    private static ApplicationJson migrateClientSchema(ApplicationJson applicationJson) {
        if (JsonSchemaVersions.clientVersion.equals(applicationJson.getClientSchemaVersion())) {
            // No need to run client side migration
            return applicationJson;
        }
        // Today server is not responsible to run the client side DSL migration but this can be useful if we start
        // supporting this on server side
        return applicationJson;
    }


}
