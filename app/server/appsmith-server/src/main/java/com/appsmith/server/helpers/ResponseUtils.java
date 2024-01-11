package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.helpers.ce.ResponseUtilsCE;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
public class ResponseUtils extends ResponseUtilsCE {

    public ActionDTO updateActionDTOWithDefaultResources(ActionDTO action) {
        super.updateActionDTOWithDefaultResources(action);

        DefaultResources defaultResourceIds = action.getDefaultResources();

        if (defaultResourceIds == null) {
            return action;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(action.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(action.getRootModuleInstanceId());
        }

        action.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        action.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());
        return action;
    }

    public ActionViewDTO updateActionViewDTOWithDefaultResources(ActionViewDTO viewDTO) {
        super.updateActionViewDTOWithDefaultResources(viewDTO);

        DefaultResources defaultResourceIds = viewDTO.getDefaultResources();

        if (defaultResourceIds == null) {
            return viewDTO;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(viewDTO.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(viewDTO.getRootModuleInstanceId());
        }

        viewDTO.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        viewDTO.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());
        return viewDTO;
    }

    public NewAction updateNewActionWithDefaultResources(NewAction newAction) {
        super.updateNewActionWithDefaultResources(newAction);

        DefaultResources defaultResourceIds = newAction.getDefaultResources();

        if (defaultResourceIds == null) {
            return newAction;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(newAction.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(newAction.getRootModuleInstanceId());
        }

        newAction.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        newAction.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());
        if (newAction.getUnpublishedAction() != null) {
            newAction.setUnpublishedAction(this.updateActionDTOWithDefaultResources(newAction.getUnpublishedAction()));
        }
        if (newAction.getPublishedAction() != null) {
            newAction.setPublishedAction(this.updateActionDTOWithDefaultResources(newAction.getPublishedAction()));
        }
        return newAction;
    }

    public ActionCollection updateActionCollectionWithDefaultResources(ActionCollection actionCollection) {
        super.updateActionCollectionWithDefaultResources(actionCollection);

        DefaultResources defaultResourceIds = actionCollection.getDefaultResources();

        if (defaultResourceIds == null) {
            return actionCollection;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(actionCollection.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(actionCollection.getRootModuleInstanceId());
        }

        actionCollection.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        actionCollection.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());
        if (actionCollection.getUnpublishedCollection() != null) {
            actionCollection.setUnpublishedCollection(
                    this.updateCollectionDTOWithDefaultResources(actionCollection.getUnpublishedCollection()));
        }
        if (actionCollection.getPublishedCollection() != null) {
            actionCollection.setPublishedCollection(
                    this.updateCollectionDTOWithDefaultResources(actionCollection.getPublishedCollection()));
        }
        return actionCollection;
    }

    public ActionCollectionDTO updateCollectionDTOWithDefaultResources(ActionCollectionDTO collection) {
        super.updateCollectionDTOWithDefaultResources(collection);

        DefaultResources defaultResourceIds = collection.getDefaultResources();

        if (defaultResourceIds == null) {
            return collection;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(collection.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(collection.getRootModuleInstanceId());
        }

        collection.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        collection.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());

        // Update actions within the collection
        collection.getActions().forEach(this::updateActionDTOWithDefaultResources);
        collection.getArchivedActions().forEach(this::updateActionDTOWithDefaultResources);

        return collection;
    }

    public ActionCollectionViewDTO updateActionCollectionViewDTOWithDefaultResources(ActionCollectionViewDTO viewDTO) {
        super.updateActionCollectionViewDTOWithDefaultResources(viewDTO);

        DefaultResources defaultResourceIds = viewDTO.getDefaultResources();

        if (defaultResourceIds == null) {
            return viewDTO;
        }
        if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
            defaultResourceIds.setModuleInstanceId(viewDTO.getModuleInstanceId());
        }
        if (StringUtils.isEmpty(defaultResourceIds.getRootModuleInstanceId())) {
            defaultResourceIds.setRootModuleInstanceId(viewDTO.getRootModuleInstanceId());
        }

        viewDTO.setModuleInstanceId(defaultResourceIds.getModuleInstanceId());
        viewDTO.setRootModuleInstanceId(defaultResourceIds.getRootModuleInstanceId());

        viewDTO.getActions().forEach(this::updateActionDTOWithDefaultResources);
        return viewDTO;
    }

    public ModuleInstanceDTO updateModuleInstanceDTOWithDefaultResources(ModuleInstanceDTO moduleInstanceDTO) {
        DefaultResources defaultResourceIds = moduleInstanceDTO.getDefaultResources();
        if (defaultResourceIds == null
                || StringUtils.isEmpty(defaultResourceIds.getApplicationId())
                || StringUtils.isEmpty(defaultResourceIds.getPageId())
                || StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {

            if (defaultResourceIds == null) {
                return moduleInstanceDTO;
            }
            if (StringUtils.isEmpty(defaultResourceIds.getApplicationId())) {
                defaultResourceIds.setApplicationId(moduleInstanceDTO.getApplicationId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getPageId())) {
                defaultResourceIds.setPageId(moduleInstanceDTO.getPageId());
            }
            if (StringUtils.isEmpty(defaultResourceIds.getModuleInstanceId())) {
                defaultResourceIds.setModuleInstanceId(moduleInstanceDTO.getId());
            }
        }
        moduleInstanceDTO.setApplicationId(defaultResourceIds.getApplicationId());
        moduleInstanceDTO.setPageId(defaultResourceIds.getPageId());
        if (ContextTypeUtils.isPageContext(moduleInstanceDTO.getContextType())) {
            moduleInstanceDTO.setContextId(defaultResourceIds.getPageId());
        }
        moduleInstanceDTO.setId(defaultResourceIds.getModuleInstanceId());
        return moduleInstanceDTO;
    }
}
