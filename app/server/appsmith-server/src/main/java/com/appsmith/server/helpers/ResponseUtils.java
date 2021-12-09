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
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Component
public class ResponseUtils {

    public PageDTO updatePageDTOWithDefaultResources(PageDTO page) {
        DefaultResources defaults = page.getDefaultResources();
        if (defaults == null
                || StringUtils.isEmpty(defaults.getApplicationId())
                || StringUtils.isEmpty(defaults.getPageId())) {

            log.debug("Unable to find default ids for page: {}", page.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "page", page.getId());
        }
        page.setApplicationId(defaults.getApplicationId());
        page.setId(defaults.getPageId());

        page.getLayouts()
                .stream().filter(layout -> !CollectionUtils.isEmpty(layout.getLayoutOnLoadActions()))
                .forEach(layout -> layout.getLayoutOnLoadActions()
                        .forEach(dslActionDTOS -> dslActionDTOS
                                .forEach(actionDTO -> actionDTO.setId(actionDTO.getDefaultActionId())))
                );

        return page;
    }

    public NewPage updateNewPageWithDefaultResources(NewPage newPage) {
        DefaultResources defaultResources = newPage.getDefaultResources();
        if (defaultResources == null) {
            log.debug("Unable to find default ids for page: {}", newPage.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "page", newPage.getId());
        }
        newPage.setId(defaultResources.getPageId());
        newPage.setApplicationId(defaultResources.getApplicationId());
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
        pageNameIdList.forEach(page -> {
            if (StringUtils.isEmpty(page.getDefaultPageId())) {
                log.debug("Unable to find default pageId for applicationPage: {}", page.getId());
                throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "applicationPage", page.getId());
            }
            page.setId(page.getDefaultPageId());
        });
        return applicationPages;
    }

    public ActionDTO updateActionDTOWithDefaultResources(ActionDTO action) {
        DefaultResources defaults = action.getDefaultResources();
        if (defaults == null
                || StringUtils.isEmpty(defaults.getApplicationId())
                || StringUtils.isEmpty(defaults.getPageId())
                || StringUtils.isEmpty(defaults.getActionId())) {
            log.debug("Unable to find default ids for action: {}", action.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", action.getId());
        }
        action.setApplicationId(defaults.getApplicationId());
        action.setPageId(defaults.getPageId());
        action.setId(defaults.getActionId());
        action.setCollectionId(defaults.getCollectionId());
        return action;
    }

    public LayoutDTO updateLayoutDTOWithDefaultResources(LayoutDTO layout) {
        if (!CollectionUtils.isEmpty(layout.getActionUpdates())) {
            layout.getActionUpdates()
                    .forEach(updateLayoutAction -> updateLayoutAction.setId(updateLayoutAction.getDefaultActionId()));
        }
        if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
            layout.getLayoutOnLoadActions().forEach(layoutOnLoadAction ->
                    layoutOnLoadAction.forEach(onLoadAction -> onLoadAction.setId(onLoadAction.getDefaultActionId())));
        }
        return layout;
    }

    public Layout updateLayoutWithDefaultResources(Layout layout) {
        if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
            layout.getLayoutOnLoadActions().forEach(layoutOnLoadAction ->
                    layoutOnLoadAction.forEach(onLoadAction -> onLoadAction.setId(onLoadAction.getDefaultActionId())));
        }
        return layout;
    }

    public ActionViewDTO updateActionViewDTOWithDefaultResources(ActionViewDTO viewDTO) {
        DefaultResources defaults = viewDTO.getDefaultResources();
        if (defaults == null
                || StringUtils.isEmpty(defaults.getActionId())) {
            log.debug("Unable to find default ids for actionViewDTO: {}", viewDTO.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "actionView", viewDTO.getId());
        }
        viewDTO.setId(defaults.getActionId());
        viewDTO.setPageId(defaults.getPageId());
        return viewDTO;
    }

    public NewAction updateNewActionWithDefaultResources(NewAction newAction) {
        DefaultResources defaultResources = newAction.getDefaultResources();
        if (defaultResources == null) {
            log.debug("Unable to find default ids for newAction: {}", newAction.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "action", newAction.getId());
        }
        newAction.setId(defaultResources.getActionId());
        newAction.setApplicationId(defaultResources.getApplicationId());
        if (newAction.getUnpublishedAction() != null) {
            newAction.setUnpublishedAction(this.updateActionDTOWithDefaultResources(newAction.getUnpublishedAction()));
        }
        if (newAction.getPublishedAction() != null) {
            newAction.setPublishedAction(this.updateActionDTOWithDefaultResources(newAction.getPublishedAction()));
        }
        return newAction;
    }

    public ActionCollection updateActionCollectionWithDefaultResources(ActionCollection actionCollection) {
        DefaultResources defaultResources = actionCollection.getDefaultResources();
        if (defaultResources == null) {
            log.debug("Unable to find default ids for actionCollection: {}", actionCollection.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "actionCollection", actionCollection.getId());
        }
        actionCollection.setId(defaultResources.getCollectionId());
        actionCollection.setApplicationId(defaultResources.getApplicationId());
        if (actionCollection.getUnpublishedCollection() != null) {
            actionCollection.setUnpublishedCollection(this.updateCollectionDTOWithDefaultResources(actionCollection.getUnpublishedCollection()));
        }
        if (actionCollection.getPublishedCollection() != null) {
            actionCollection.setPublishedCollection(this.updateCollectionDTOWithDefaultResources(actionCollection.getPublishedCollection()));
        }
        return actionCollection;
    }

    public ActionCollectionDTO updateCollectionDTOWithDefaultResources(ActionCollectionDTO collection) {
        DefaultResources defaults = collection.getDefaultResources();
        if (defaults == null
                || StringUtils.isEmpty(defaults.getApplicationId())
                || StringUtils.isEmpty(defaults.getPageId())
                || StringUtils.isEmpty(defaults.getCollectionId())) {
            log.debug("Unable to find default ids for actionCollection: {}", collection.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "actionCollection", collection.getId());
        }
        collection.setApplicationId(defaults.getApplicationId());
        collection.setPageId(defaults.getPageId());
        collection.setId(defaults.getCollectionId());

        // Update actions within the collection
        collection.getActions().forEach(this::updateActionDTOWithDefaultResources);
        collection.getArchivedActions().forEach(this::updateActionDTOWithDefaultResources);
        
        return collection;
    }

    public ActionCollectionViewDTO updateActionCollectionViewDTOWithDefaultResources(ActionCollectionViewDTO viewDTO) {
        DefaultResources defaults = viewDTO.getDefaultResources();
        if (defaults == null
                || StringUtils.isEmpty(defaults.getCollectionId())) {
            log.debug("Unable to find default ids for actionCollectionViewDTO: {}", viewDTO.getId());
            throw new AppsmithException(AppsmithError.DEFAULT_RESOURCES_UNAVAILABLE, "actionCollectionView", viewDTO.getId());
        }
        viewDTO.setId(defaults.getCollectionId());
        viewDTO.setApplicationId(defaults.getApplicationId());
        viewDTO.setPageId(defaults.getPageId());
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
