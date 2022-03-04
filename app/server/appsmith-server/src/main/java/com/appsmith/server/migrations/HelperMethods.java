package com.appsmith.server.migrations;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;

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
}
