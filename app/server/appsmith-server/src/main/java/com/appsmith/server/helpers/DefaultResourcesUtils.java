package com.appsmith.server.helpers;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import org.springframework.util.StringUtils;

public class DefaultResourcesUtils {
    public static <T> T createPristineDefaultIdsAndUpdateWithGivenResourceIds(T resource, String branchName) {
        DefaultResources defaultResources = new DefaultResources();
        if (!StringUtils.isEmpty(branchName)) {
            defaultResources.setBranchName(branchName);
        }
        if (resource instanceof NewAction) {
            NewAction action = (NewAction) resource;
            defaultResources.setApplicationId(action.getApplicationId());
            defaultResources.setActionId(action.getId());
            action.setDefaultResources(defaultResources);
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
        } else if (resource instanceof ActionCollection) {
            ActionCollection actionCollection = (ActionCollection) resource;
            defaultResources.setApplicationId(actionCollection.getApplicationId());
            defaultResources.setCollectionId(actionCollection.getId());
            actionCollection.setDefaultResources(defaultResources);
        } else if (resource instanceof ActionCollectionDTO) {
            ActionCollectionDTO collectionDTO = (ActionCollectionDTO) resource;
            defaultResources.setPageId(collectionDTO.getPageId());
            collectionDTO.setDefaultResources(defaultResources);
        }
        return resource;
    }
}
