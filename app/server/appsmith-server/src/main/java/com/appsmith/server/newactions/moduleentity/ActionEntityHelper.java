package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.NewAction;

public class ActionEntityHelper {

    public static NewAction generateActionDomain(
            String moduleId, String workspaceId, boolean isPublic, ActionDTO moduleActionDTO) {
        NewAction moduleAction = new NewAction();
        moduleAction.setWorkspaceId(workspaceId);

        moduleAction.setIsPublic(isPublic);
        moduleActionDTO.setIsPublic(isPublic);
        moduleActionDTO.setModuleId(moduleId);
        moduleActionDTO.setDefaultResources(new DefaultResources());
        moduleActionDTO.setContextType(CreatorContextType.MODULE);

        moduleAction.setUnpublishedAction(moduleActionDTO);
        moduleAction.setPublishedAction(new ActionDTO());
        moduleAction.setDefaultResources(new DefaultResources());

        return moduleAction;
    }
}
