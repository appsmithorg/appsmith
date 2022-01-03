package com.appsmith.server.helpers;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class DefaultResourcesUtils {
    public static <T> T createPristineDefaultIdsAndUpdateWithGivenResourceIds(T resource, String branchName) {
        DefaultResources defaultResources = new DefaultResources();

        defaultResources.setBranchName(branchName);
        if (resource instanceof NewAction) {
            NewAction action = (NewAction) resource;
            defaultResources.setApplicationId(action.getApplicationId());
            defaultResources.setActionId(action.getId());
            action.setDefaultResources(defaultResources);

            createPristineDefaultIdsAndUpdateWithGivenResourceIds(action.getUnpublishedAction(), branchName);
            if (Optional.ofNullable(action.getPublishedAction()).isPresent()) {
                createPristineDefaultIdsAndUpdateWithGivenResourceIds(action.getPublishedAction(), branchName);
            }
        } else if (resource instanceof ActionDTO) {
            ActionDTO action = (ActionDTO) resource;
            defaultResources.setPageId(action.getPageId());
            defaultResources.setCollectionId(action.getCollectionId());
            action.setDefaultResources(defaultResources);
        } else if (resource instanceof NewPage) {
            NewPage page = (NewPage) resource;
            defaultResources.setApplicationId(page.getApplicationId());
            defaultResources.setPageId(page.getId());
            page.setDefaultResources(defaultResources);

            // Copy layoutOnLoadAction Ids to defaultActionId
            page.getUnpublishedPage()
                    .getLayouts()
                    .forEach(layout -> {
                        if (!CollectionUtils.isNullOrEmpty(layout.getLayoutOnLoadActions())) {
                            layout.getLayoutOnLoadActions()
                                    .forEach(dslActionDTOS -> dslActionDTOS
                                            .forEach(actionDTO -> actionDTO.setDefaultActionId(actionDTO.getId()))
                                    );
                        }
                    });

            if (page.getPublishedPage() != null && !CollectionUtils.isNullOrEmpty(page.getPublishedPage().getLayouts())) {
                page.getPublishedPage()
                        .getLayouts()
                        .forEach(layout -> {
                            if (!CollectionUtils.isNullOrEmpty(layout.getLayoutOnLoadActions())) {
                                layout.getLayoutOnLoadActions()
                                        .forEach(dslActionDTOS -> dslActionDTOS
                                                .forEach(actionDTO -> actionDTO.setDefaultActionId(actionDTO.getId()))
                                        );
                            }
                        });
            }

        } else if (resource instanceof ActionCollection) {
            ActionCollection actionCollection = (ActionCollection) resource;
            defaultResources.setApplicationId(actionCollection.getApplicationId());
            defaultResources.setCollectionId(actionCollection.getId());
            actionCollection.setDefaultResources(defaultResources);

            createPristineDefaultIdsAndUpdateWithGivenResourceIds(actionCollection.getUnpublishedCollection(), branchName);
            if (Optional.ofNullable(actionCollection.getPublishedCollection()).isPresent()) {
                createPristineDefaultIdsAndUpdateWithGivenResourceIds(actionCollection.getPublishedCollection(), branchName);
            }
        } else if (resource instanceof ActionCollectionDTO) {
            ActionCollectionDTO collectionDTO = (ActionCollectionDTO) resource;
            defaultResources.setPageId(collectionDTO.getPageId());
            collectionDTO.setDefaultResources(defaultResources);

            Map<String, String> updatedActionIds = new HashMap<>();
            if (!CollectionUtils.isNullOrEmpty(collectionDTO.getDefaultToBranchedActionIdsMap())) {
                collectionDTO.getDefaultToBranchedActionIdsMap()
                        .values()
                        .forEach(val -> updatedActionIds.put(val, val));
                collectionDTO.setDefaultToBranchedActionIdsMap(updatedActionIds);
            }
        }
        return resource;
    }
}
