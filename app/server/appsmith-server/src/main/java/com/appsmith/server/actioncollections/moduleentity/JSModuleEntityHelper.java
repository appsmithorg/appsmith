package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ActionCollectionDTO;

public class JSModuleEntityHelper {
    public static ActionCollection generateActionCollectionDomain(
            Module module, String workspaceId, boolean isPublic, ActionCollectionDTO actionCollectionDTO) {
        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setWorkspaceId(workspaceId);
        actionCollection.setPackageId(module.getPackageId());
        actionCollection.setIsPublic(isPublic);

        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setIsPublic(isPublic);
        actionCollectionDTO.setModuleId(module.getId());
        actionCollectionDTO.setDefaultResources(new DefaultResources());
        actionCollectionDTO.setContextType(CreatorContextType.MODULE);

        // Ensure that all actions in the collection have the same contextType and moduleId as the collection itself
        actionCollectionDTO.getActions().stream().forEach(action -> {
            action.setIsPublic(isPublic);
            action.setPackageId(module.getPackageId());
            action.setModuleId(module.getId());
            action.setContextType(CreatorContextType.MODULE);
        });

        actionCollection.setUnpublishedCollection(actionCollectionDTO);
        actionCollection.setDefaultResources(new DefaultResources());

        return actionCollection;
    }
}
