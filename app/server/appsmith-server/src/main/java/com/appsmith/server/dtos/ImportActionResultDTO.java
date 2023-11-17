package com.appsmith.server.dtos;

import com.appsmith.server.domains.NewAction;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
public class ImportActionResultDTO {
    private final List<String> importedActionIds;

    @Setter
    private Collection<NewAction> existingActions;

    // Map which will be used to store actionIds from imported file to actual actionIds from DB
    // this will eventually be used to update on page load actions
    private final Map<String, String> actionIdMap;

    // Map which will be used to store unpublished collectionId from imported file to
    // actual actionIds from DB, format for value will be <defaultActionId, actionId>
    // for more details please check defaultToBranchedActionIdsMap {@link ActionCollectionDTO}
    private final Map<String, Map<String, String>> unpublishedCollectionIdToActionIdsMap;

    // Map which will be used to store published collectionId from imported file to
    // actual actionIds from DB, format for value will be <defaultActionId, actionId>
    // for more details please check defaultToBranchedActionIdsMap{@link ActionCollectionDTO}
    private final Map<String, Map<String, String>> publishedCollectionIdToActionIdsMap;

    public ImportActionResultDTO() {
        importedActionIds = new ArrayList<>();
        actionIdMap = new HashMap<>();
        unpublishedCollectionIdToActionIdsMap = new HashMap<>();
        publishedCollectionIdToActionIdsMap = new HashMap<>();
    }

    /**
     * Method to get a gist of the result. Primarily used for logging.
     * @return
     */
    public String getGist() {
        return String.format(
                "existing actions: %d, imported actions: %d", existingActions.size(), importedActionIds.size());
    }
}
