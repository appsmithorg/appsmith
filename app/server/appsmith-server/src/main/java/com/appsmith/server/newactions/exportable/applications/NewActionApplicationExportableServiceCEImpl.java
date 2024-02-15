package com.appsmith.server.newactions.exportable.applications;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.exportable.utils.ApplicationExportableUtilsImpl;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableServiceCE;
import com.appsmith.server.newactions.base.NewActionService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class NewActionApplicationExportableServiceCEImpl extends ApplicationExportableUtilsImpl
        implements ArtifactBasedExportableServiceCE<NewAction, Application> {

    private final NewActionService newActionService;

    @Override
    public Flux<NewAction> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return newActionService.findByPageIdsForExport(contextIds, Optional.ofNullable(permission));
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            NewAction newAction,
            ResourceModes resourceMode) {

        newAction.setApplicationId(null);

        ActionDTO actionDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            actionDTO = newAction.getUnpublishedAction();
        } else {
            actionDTO = newAction.getPublishedAction();
        }
        actionDTO.setPageId(
                mappedExportableResourcesDTO.getContextIdToNameMap().get(actionDTO.getPageId() + resourceMode));

        if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                && mappedExportableResourcesDTO.getCollectionIdToNameMap().containsKey(actionDTO.getCollectionId())) {
            actionDTO.setCollectionId(
                    mappedExportableResourcesDTO.getCollectionIdToNameMap().get(actionDTO.getCollectionId()));
        }

        if (!mappedExportableResourcesDTO.getActionIdToNameMap().containsValue(newAction.getId())) {
            final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
            mappedExportableResourcesDTO.getActionIdToNameMap().put(newAction.getId(), updatedActionId);
            newAction.setId(updatedActionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;
        return actionDTO.getPageId();
    }
}
