package com.appsmith.server.migrations;

import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

public class JsonSchemaMigration {
    private static Boolean checkCompatibility(ApplicationJson applicationJson) {
        return (applicationJson.getClientSchemaVersion() <= JsonSchemaVersions.clientVersion)
                && (applicationJson.getServerSchemaVersion() <= JsonSchemaVersions.serverVersion);
    }

    public static ApplicationJson migrateApplicationToLatestSchema(ApplicationJson applicationJson) {
        // Check if the schema versions are available and set to initial version if not present
        Integer serverSchemaVersion = applicationJson.getServerSchemaVersion() == null ? 0 : applicationJson.getServerSchemaVersion();
        Integer clientSchemaVersion = applicationJson.getClientSchemaVersion() == null ? 0 : applicationJson.getClientSchemaVersion();

        applicationJson.setClientSchemaVersion(clientSchemaVersion);
        applicationJson.setServerSchemaVersion(serverSchemaVersion);
        if (Boolean.FALSE.equals(checkCompatibility(applicationJson))) {
            throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
        }
        migrateServerSchema(applicationJson);
        migrateClientSchema(applicationJson);
        return applicationJson;
    }

    private static ApplicationJson migrateServerSchema(ApplicationJson applicationJson) {
        if (applicationJson.getServerSchemaVersion().equals(JsonSchemaVersions.serverVersion)) {
            // No need to run server side migration
            return applicationJson;
        }
        // Run migration linearly
        switch (applicationJson.getServerSchemaVersion()) {
            case 0:

            case 1:

            default:
                // Unable to detect the severSchema
        }
        return applicationJson;
    }

    private static ApplicationJson migrateClientSchema(ApplicationJson applicationJson) {
        if (applicationJson.getClientSchemaVersion().equals(JsonSchemaVersions.clientVersion)) {
            // No need to run client side migration
            return applicationJson;
        }
        // Today server is not responsible to run the client side DSL migration but this can be useful if we start
        // supporting this on server side
        return applicationJson;
    }
}
