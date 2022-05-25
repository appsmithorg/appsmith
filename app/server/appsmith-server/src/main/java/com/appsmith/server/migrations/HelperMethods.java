package com.appsmith.server.migrations;

import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.helpers.CollectionUtils;

import java.time.Instant;
import java.util.List;

public class HelperMethods {
    // Migration for deprecating archivedAt field in ActionDTO
    public static void updateArchivedAtByDeletedATForActions(List<NewAction> actionList) {
        for (NewAction newAction : actionList) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            if (unpublishedAction != null) {
                final Instant archivedAt = unpublishedAction.getArchivedAt();
                unpublishedAction.setDeletedAt(archivedAt);
                unpublishedAction.setArchivedAt(null);
            }
        }
    }

    public static void migrateActionFormDataToObject(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
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

    public static void migrateGoogleSheetsActionsToUqi(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
            actionList.parallelStream()
                    .forEach(newAction -> {
                        // Determine plugin
                        final String pluginName = newAction.getPluginId();
                        if ("google-sheets-plugin".equals(pluginName)) {
                            DatabaseChangelog2.migrateGoogleSheetsToUqi(newAction);
                        }
                    });
        }
    }
}
