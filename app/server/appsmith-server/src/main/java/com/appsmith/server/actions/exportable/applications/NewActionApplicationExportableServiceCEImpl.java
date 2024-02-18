package com.appsmith.server.actions.exportable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.applications.exportable.utils.ApplicationExportableUtilsImpl;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableServiceCE;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class NewActionApplicationExportableServiceCEImpl extends ApplicationExportableUtilsImpl
        implements ArtifactBasedExportableServiceCE<Action, Application> {

    private final ActionService actionService;

    @Override
    public Flux<Action> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return actionService.findByPageIdsForExport(contextIds, Optional.ofNullable(permission));
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, Action action, ResourceModes resourceMode) {

        action.setApplicationId(null);

        ActionDTO actionDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            actionDTO = action.getUnpublishedAction();
        } else {
            actionDTO = action.getPublishedAction();
        }
        actionDTO.setPageId(
                mappedExportableResourcesDTO.getContextIdToNameMap().get(actionDTO.getPageId() + resourceMode));

        if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                && mappedExportableResourcesDTO.getCollectionIdToNameMap().containsKey(actionDTO.getCollectionId())) {
            actionDTO.setCollectionId(
                    mappedExportableResourcesDTO.getCollectionIdToNameMap().get(actionDTO.getCollectionId()));
        }

        if (!mappedExportableResourcesDTO.getActionIdToNameMap().containsValue(action.getId())) {
            final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
            mappedExportableResourcesDTO.getActionIdToNameMap().put(action.getId(), updatedActionId);
            action.setId(updatedActionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;
        return actionDTO.getPageId();
    }
}
