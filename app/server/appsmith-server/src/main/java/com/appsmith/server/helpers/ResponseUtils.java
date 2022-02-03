package com.appsmith.server.helpers;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.AbstractCommentDomain;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Component
public class ResponseUtils {

    public PageDTO updatePageDTOWithDefaultResources(PageDTO page) {
        DefaultResources defaultResourceIds = page.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getPageId())) {

            if (defaultResourceIds == null) {
                return page;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(page.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(page.getId());
            }
        }
        page.setApplicationId(defaultResourceIds.getApplicationId());
        page.setId(defaultResourceIds.getPageId());

        page.getLayouts()
                .stream().filter(layout -> !CollectionUtils.isEmpty(layout.getLayoutOnLoadActions()))
                .forEach(layout -> layout.getLayoutOnLoadActions()
                        .forEach(dslActionDTOS -> dslActionDTOS
                                .forEach(actionDTO -> {
                                    if (!StringUtils.isEmpty(actionDTO.getDefaultActionId())) {
                                        actionDTO.setId(actionDTO.getDefaultActionId());
                                    }
                                }))
                );
        return page;
    }

    public NewPage updateNewPageWithDefaultResources(NewPage newPage) {
        DefaultResources defaultResourceIds = newPage.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
        ) {
            log.error(
                    "Unable to find default ids for page: {}",
                    newPage.getId(),
                    new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "page", newPage.getId())
            );

            if (defaultResourceIds == null) {
                return newPage;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(newPage.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(newPage.getId());
            }
        }
        newPage.setId(defaultResourceIds.getPageId());
        newPage.setApplicationId(defaultResourceIds.getApplicationId());
        if (newPage.getUnpublishedPage() != null) {
            newPage.setUnpublishedPage(this.updatePageDTOWithDefaultResources(newPage.getUnpublishedPage()));
        }
        if (newPage.getPublishedPage() != null) {
            newPage.setPublishedPage(this.updatePageDTOWithDefaultResources(newPage.getPublishedPage()));
        }
        return newPage;
    }

    public ApplicationPagesDTO updateApplicationPagesDTOWithDefaultResources(ApplicationPagesDTO applicationPages) {
        List<PageNameIdDTO> pageNameIdList = applicationPages.getPages();
        for (PageNameIdDTO page : pageNameIdList) {
            if (StringUtils.isEmpty(page.getDefaultPageId())) {
                log.error(
                        "Unable to find default pageId for applicationPage: {}",
                        page.getId(),
                        new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "applicationPage", page.getId())
                );
                continue;
            }
            page.setId(page.getDefaultPageId());
        }
        return applicationPages;
    }

    public ActionDTO updateActionDTOWithDefaultResources(ActionDTO action) {
        DefaultResources defaultResourceIds = action.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
                || StringUtils.isEmpty(defaultResourceIds.getActionId())) {

            if (defaultResourceIds == null) {
                return action;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(action.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(action.getPageId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getActionId())) {
                defaultResourceIds.setActionId(action.getId());
            }
        }
        action.setApplicationId(defaultResourceIds.getApplicationId());
        action.setPageId(defaultResourceIds.getPageId());
        action.setId(defaultResourceIds.getActionId());
        if (!StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {
            action.setCollectionId(defaultResourceIds.getCollectionId());
        }
        return action;
    }

    public LayoutDTO updateLayoutDTOWithDefaultResources(LayoutDTO layout) {
        if (!CollectionUtils.isEmpty(layout.getActionUpdates())) {
            layout.getActionUpdates()
                    .forEach(updateLayoutAction -> updateLayoutAction.setId(updateLayoutAction.getDefaultActionId()));
        }
        if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
            layout.getLayoutOnLoadActions().forEach(layoutOnLoadAction ->
                    layoutOnLoadAction.forEach(onLoadAction -> {
                        if (!StringUtils.isEmpty(onLoadAction.getDefaultActionId())) {
                            onLoadAction.setId(onLoadAction.getDefaultActionId());
                        }
                    })
            );
        }
        return layout;
    }

    public Layout updateLayoutWithDefaultResources(Layout layout) {
        if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
            layout.getLayoutOnLoadActions().forEach(layoutOnLoadAction ->
                    layoutOnLoadAction.forEach(onLoadAction -> {
                        if (!StringUtils.isEmpty(onLoadAction.getDefaultActionId())) {
                            onLoadAction.setId(onLoadAction.getDefaultActionId());
                        }
                    }));
        }
        return layout;
    }

    public ActionViewDTO updateActionViewDTOWithDefaultResources(ActionViewDTO viewDTO) {
        DefaultResources defaultResourceIds = viewDTO.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
                || StringUtils.isEmpty(defaultResourceIds.getActionId())) {

            if (defaultResourceIds == null) {
                return viewDTO;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(viewDTO.getPageId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getActionId())) {
                defaultResourceIds.setActionId(viewDTO.getId());
            }
        }
        viewDTO.setId(defaultResourceIds.getActionId());
        viewDTO.setPageId(defaultResourceIds.getPageId());
        return viewDTO;
    }

    public NewAction updateNewActionWithDefaultResources(NewAction newAction) {
        DefaultResources defaultResourceIds = newAction.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getActionId())) {
            log.error(
                    "Unable to find default ids for newAction: {}",
                    newAction.getId(),
                    new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "newAction", newAction.getId())
            );

            if (defaultResourceIds == null) {
                return newAction;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(newAction.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getActionId())) {
                defaultResourceIds.setActionId(newAction.getId());
            }
        }

        newAction.setId(defaultResourceIds.getActionId());
        newAction.setApplicationId(defaultResourceIds.getApplicationId());
        if (newAction.getUnpublishedAction() != null) {
            newAction.setUnpublishedAction(this.updateActionDTOWithDefaultResources(newAction.getUnpublishedAction()));
        }
        if (newAction.getPublishedAction() != null) {
            newAction.setPublishedAction(this.updateActionDTOWithDefaultResources(newAction.getPublishedAction()));
        }
        return newAction;
    }

    public ActionCollection updateActionCollectionWithDefaultResources(ActionCollection actionCollection) {
        DefaultResources defaultResourceIds = actionCollection.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {
            log.error(
                    "Unable to find default ids for actionCollection: {}",
                    actionCollection.getId(),
                    new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "actionCollection", actionCollection.getId())
            );

            if (defaultResourceIds == null) {
                return actionCollection;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(actionCollection.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {
                defaultResourceIds.setCollectionId(actionCollection.getId());
            }
        }
        actionCollection.setId(defaultResourceIds.getCollectionId());
        actionCollection.setApplicationId(defaultResourceIds.getApplicationId());
        if (actionCollection.getUnpublishedCollection() != null) {
            actionCollection.setUnpublishedCollection(this.updateCollectionDTOWithDefaultResources(actionCollection.getUnpublishedCollection()));
        }
        if (actionCollection.getPublishedCollection() != null) {
            actionCollection.setPublishedCollection(this.updateCollectionDTOWithDefaultResources(actionCollection.getPublishedCollection()));
        }
        return actionCollection;
    }

    public ActionCollectionDTO updateCollectionDTOWithDefaultResources(ActionCollectionDTO collection) {
        DefaultResources defaultResourceIds = collection.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
                || StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {

            if (defaultResourceIds == null) {
                return collection;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(collection.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(collection.getPageId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {
                defaultResourceIds.setCollectionId(collection.getId());
            }
        }
        collection.setApplicationId(defaultResourceIds.getApplicationId());
        collection.setPageId(defaultResourceIds.getPageId());
        collection.setId(defaultResourceIds.getCollectionId());

        // Update actions within the collection
        collection.getActions().forEach(this::updateActionDTOWithDefaultResources);
        collection.getArchivedActions().forEach(this::updateActionDTOWithDefaultResources);
        
        return collection;
    }

    public ActionCollectionViewDTO updateActionCollectionViewDTOWithDefaultResources(ActionCollectionViewDTO viewDTO) {
        DefaultResources defaultResourceIds = viewDTO.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {

            if (defaultResourceIds == null) {
                return viewDTO;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(viewDTO.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(viewDTO.getPageId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getCollectionId())) {
                defaultResourceIds.setCollectionId(viewDTO.getId());
            }
        }
        viewDTO.setId(defaultResourceIds.getCollectionId());
        viewDTO.setApplicationId(defaultResourceIds.getApplicationId());
        viewDTO.setPageId(defaultResourceIds.getPageId());
        viewDTO.getActions().forEach(this::updateActionDTOWithDefaultResources);
        return viewDTO;
    }

    public Application updateApplicationWithDefaultResources(Application application) {
        if (application.getGitApplicationMetadata() != null
                && !StringUtils.isEmpty(application.getGitApplicationMetadata().getDefaultApplicationId())) {
            application.setId(application.getGitApplicationMetadata().getDefaultApplicationId());
        }
        if (!CollectionUtils.isEmpty(application.getPages())) {
            application
                    .getPages()
                    .forEach(page -> {
                        if (!StringUtils.isEmpty(page.getDefaultPageId())) {
                            page.setId(page.getDefaultPageId());
                        }
                    });
        }
        if (!CollectionUtils.isEmpty(application.getPublishedPages())) {
            application
                    .getPublishedPages()
                    .forEach(page -> {
                        if (!StringUtils.isEmpty(page.getDefaultPageId())) {
                            page.setId(page.getDefaultPageId());
                        }
                    });
        }
        return application;
    }

    public <T extends AbstractCommentDomain> T updatePageAndAppIdWithDefaultResourcesForComments(T resource) {
        DefaultResources defaults = resource.getDefaultResources();
        if (defaults != null) {
            if(!StringUtils.isEmpty(defaults.getPageId())) {
                resource.setPageId(defaults.getPageId());
            }
            if (!StringUtils.isEmpty(defaults.getApplicationId())) {
                resource.setApplicationId(defaults.getApplicationId());
            }
            resource.setBranchName(defaults.getBranchName());
        }
        return resource;
    }
}
