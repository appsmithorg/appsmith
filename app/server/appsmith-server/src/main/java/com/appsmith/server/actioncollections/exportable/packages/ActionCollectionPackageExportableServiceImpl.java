package com.appsmith.server.actioncollections.exportable.packages;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.crud.CrudActionCollectionService;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.packages.exportable.utils.PackageExportableUtilsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class ActionCollectionPackageExportableServiceImpl extends PackageExportableUtilsImpl
        implements ArtifactBasedExportableService<ActionCollection, Package> {

    private final CrudActionCollectionService crudActionCollectionService;

    @Override
    public Flux<ActionCollection> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return crudActionCollectionService.getByContextTypeAndContextIds(
                CreatorContextType.MODULE, contextIds, permission);
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ActionCollection actionCollection,
            ResourceModes resourceMode) {
        ActionCollectionDTO actionCollectionDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            actionCollectionDTO = actionCollection.getUnpublishedCollection();
        } else {
            actionCollectionDTO = actionCollection.getPublishedCollection();
        }
        actionCollectionDTO.setModuleId(mappedExportableResourcesDTO
                .getContextIdToNameMap()
                .get(actionCollectionDTO.getModuleId() + resourceMode));
        actionCollectionDTO.setPluginId(
                mappedExportableResourcesDTO.getPluginMap().get(actionCollectionDTO.getPluginId()));

        if (!mappedExportableResourcesDTO.getCollectionIdToNameMap().containsValue(actionCollection.getId())) {
            final String updatedCollectionId = actionCollectionDTO.getModuleId() + "_" + actionCollectionDTO.getName();
            mappedExportableResourcesDTO.getCollectionIdToNameMap().put(actionCollection.getId(), updatedCollectionId);
            actionCollection.setId(updatedCollectionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ActionCollectionDTO actionCollectionDTO = (ActionCollectionDTO) dtoObject;
        return actionCollectionDTO.getModuleId();
    }
}
