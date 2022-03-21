package com.appsmith.server.migrations;

import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;

import java.util.List;

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
                migrateActionFormDataToObject(applicationJson);
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

    private static void migrateActionFormDataToObject(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        actionList.parallelStream()
                .forEach(newAction -> {
                    // determine plugin
                    final String pluginName = newAction.getPluginId();
                    if ("mongo-plugin".equals(pluginName)) {
                        DatabaseChangelog2.migrateMongoActionsFormData(newAction);
                    } else if ("amazons3-plugin".equals(pluginName)) {
                        DatabaseChangelog2.migrateAmazonS3ActionsFormData(newAction);
                    } else if ("firestore-plugin".equals(pluginName)) {
                        DatabaseChangelog2.migrateFirestoreActionsFormData(newAction);
                    }
                });
    }
}
