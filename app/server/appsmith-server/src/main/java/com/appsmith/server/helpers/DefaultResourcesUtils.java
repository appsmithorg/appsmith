package com.appsmith.server.helpers;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class DefaultResourcesUtils {
    public static <T> T createDefaultIdsOrUpdateWithGivenResourceIds(T resource, String branchName) {

        if (resource instanceof NewAction) {
            NewAction action = (NewAction) resource;
            DefaultResources actionDefaultResources = action.getDefaultResources();

            if (Optional.ofNullable(actionDefaultResources).isEmpty()) {
                actionDefaultResources = new DefaultResources();
            }
            final String defaultApplicationId = StringUtils.isEmpty(actionDefaultResources.getApplicationId())
                    ? action.getApplicationId()
                    : actionDefaultResources.getApplicationId();

            final String defaultActionId = StringUtils.isEmpty(actionDefaultResources.getActionId())
                    ? action.getId()
                    : actionDefaultResources.getActionId();
            actionDefaultResources.setApplicationId(defaultApplicationId);
            actionDefaultResources.setActionId(defaultActionId);
            actionDefaultResources.setBranchName(branchName);

            if (Optional.ofNullable(action.getUnpublishedAction()).isPresent()) {
                createDefaultIdsOrUpdateWithGivenResourceIds(action.getUnpublishedAction(), branchName);
            }

            if (Optional.ofNullable(action.getPublishedAction()).isPresent()) {
                createDefaultIdsOrUpdateWithGivenResourceIds(action.getPublishedAction(), branchName);
            }
            action.setDefaultResources(actionDefaultResources);
        } else if (resource instanceof ActionDTO) {
            ActionDTO action = (ActionDTO) resource;
            DefaultResources actionDefaultResources = action.getDefaultResources();
            if (Optional.ofNullable(actionDefaultResources).isEmpty()) {
                actionDefaultResources = new DefaultResources();
            }
            final String defaultPageId = StringUtils.isEmpty(actionDefaultResources.getPageId())
                    ? action.getPageId()
                    : actionDefaultResources.getPageId();

            final String defaultCollectionId = StringUtils.isEmpty(actionDefaultResources.getCollectionId())
                    ? action.getCollectionId()
                    : actionDefaultResources.getCollectionId();

            actionDefaultResources.setPageId(defaultPageId);
            actionDefaultResources.setCollectionId(defaultCollectionId);
            action.setDefaultResources(actionDefaultResources);
        } else if (resource instanceof NewPage) {
            NewPage page = (NewPage) resource;
            DefaultResources pageDefaultResources = page.getDefaultResources();
            boolean updateOnLoadActionTemp = false;
            if (Optional.ofNullable(pageDefaultResources).isEmpty()) {
                pageDefaultResources = new DefaultResources();
                updateOnLoadActionTemp = true;
            }

            final String defaultApplicationId = StringUtils.isEmpty(pageDefaultResources.getApplicationId())
                    ? page.getApplicationId()
                    : pageDefaultResources.getApplicationId();

            final String defaultPageId = StringUtils.isEmpty(pageDefaultResources.getPageId())
                    ? page.getId()
                    : pageDefaultResources.getPageId();
            pageDefaultResources.setApplicationId(defaultApplicationId);
            pageDefaultResources.setPageId(defaultPageId);
            pageDefaultResources.setBranchName(branchName);

            // Copy layoutOnLoadAction Ids to defaultPageId
            final boolean updateOnLoadAction = updateOnLoadActionTemp;
            page.getUnpublishedPage()
                    .getLayouts()
                    .forEach(layout -> {
                        if (!CollectionUtils.isNullOrEmpty(layout.getLayoutOnLoadActions())) {
                            layout.getLayoutOnLoadActions()
                                    .forEach(dslActionDTOS -> dslActionDTOS
                                            .forEach(actionDTO -> {
                                                if (updateOnLoadAction || StringUtils.isEmpty(actionDTO.getDefaultActionId())) {
                                                    actionDTO.setDefaultActionId(actionDTO.getId());
                                                }
                                            })
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
                                                .forEach(actionDTO -> {
                                                    if (updateOnLoadAction || StringUtils.isEmpty(actionDTO.getDefaultActionId())) {
                                                        actionDTO.setDefaultActionId(actionDTO.getId());
                                                    }
                                                })
                                        );
                            }
                        });
            }
            page.setDefaultResources(pageDefaultResources);
        } else if (resource instanceof ActionCollection) {
            ActionCollection actionCollection = (ActionCollection) resource;

            DefaultResources actionCollectionDefaultResources = actionCollection.getDefaultResources();
            if (Optional.ofNullable(actionCollectionDefaultResources).isEmpty()) {
                actionCollectionDefaultResources = new DefaultResources();
            }

            final String defaultApplicationId = StringUtils.isEmpty(actionCollectionDefaultResources.getApplicationId())
                    ? actionCollection.getApplicationId()
                    : actionCollectionDefaultResources.getApplicationId();

            final String defaultActionCollectionId = StringUtils.isEmpty(actionCollectionDefaultResources.getCollectionId())
                    ? actionCollection.getId()
                    : actionCollectionDefaultResources.getCollectionId();
            actionCollectionDefaultResources.setApplicationId(defaultApplicationId);
            actionCollectionDefaultResources.setCollectionId(defaultActionCollectionId);
            actionCollectionDefaultResources.setBranchName(branchName);

            if (Optional.ofNullable(actionCollection.getUnpublishedCollection()).isPresent()) {
                createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection.getUnpublishedCollection(), branchName);
            }
            if (Optional.ofNullable(actionCollection.getPublishedCollection()).isPresent()) {
                createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection.getPublishedCollection(), branchName);
            }
            actionCollection.setDefaultResources(actionCollectionDefaultResources);
        } else if (resource instanceof ActionCollectionDTO) {
            ActionCollectionDTO collectionDTO = (ActionCollectionDTO) resource;
            boolean updateActionIds = false;
            DefaultResources collectionDTODefaultResources = collectionDTO.getDefaultResources();
            if (Optional.ofNullable(collectionDTODefaultResources).isEmpty()) {
                collectionDTODefaultResources = new DefaultResources();
                updateActionIds = true;
            }
            final String defaultPageId = StringUtils.isEmpty(collectionDTODefaultResources.getPageId())
                    ? collectionDTO.getPageId()
                    : collectionDTODefaultResources.getPageId();

            collectionDTODefaultResources.setPageId(defaultPageId);

            if (updateActionIds) {
                Map<String, String> updatedActionIds = new HashMap<>();
                if (!CollectionUtils.isNullOrEmpty(collectionDTO.getDefaultToBranchedActionIdsMap())) {
                    collectionDTO.getDefaultToBranchedActionIdsMap()
                            .values()
                            .forEach(val -> updatedActionIds.put(val, val));
                    collectionDTO.setDefaultToBranchedActionIdsMap(updatedActionIds);
                }
            }
            collectionDTO.setDefaultResources(collectionDTODefaultResources);
        }
        return resource;
    }
}
