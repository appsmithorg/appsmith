package com.appsmith.server.newactions.exportable.packages;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.newactions.crud.CrudNewActionService;
import com.appsmith.server.packages.exportable.utils.PackageExportableUtilsImpl;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class NewActionPackageExportableServiceImpl extends PackageExportableUtilsImpl
        implements ArtifactBasedExportableService<NewAction, Package> {

    private final CrudNewActionService crudNewActionService;

    @Override
    public Flux<NewAction> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return crudNewActionService.getByContextTypeAndContextIds(CreatorContextType.MODULE, contextIds, permission);
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            NewAction newAction,
            ResourceModes resourceMode) {

        ActionDTO actionDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            actionDTO = newAction.getUnpublishedAction();
        } else {
            actionDTO = newAction.getPublishedAction();
        }
        actionDTO.setPageId(
                mappedExportableResourcesDTO.getContextIdToNameMap().get(actionDTO.getModuleId() + resourceMode));

        if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                && mappedExportableResourcesDTO.getCollectionIdToNameMap().containsKey(actionDTO.getCollectionId())) {
            actionDTO.setCollectionId(
                    mappedExportableResourcesDTO.getCollectionIdToNameMap().get(actionDTO.getCollectionId()));
        }

        if (!mappedExportableResourcesDTO.getActionIdToNameMap().containsValue(newAction.getId())) {
            final String updatedActionId = actionDTO.getModuleId() + "_" + actionDTO.getValidName();
            mappedExportableResourcesDTO.getActionIdToNameMap().put(newAction.getId(), updatedActionId);
            newAction.setId(updatedActionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ActionDTO actionDTO = (ActionDTO) dtoObject;
        return actionDTO.getModuleId();
    }
}
