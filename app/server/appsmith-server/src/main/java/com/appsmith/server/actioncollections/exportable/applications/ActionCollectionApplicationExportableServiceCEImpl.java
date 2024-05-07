package com.appsmith.server.actioncollections.exportable.applications;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.exportable.utils.ApplicationExportableUtilsImpl;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableServiceCE;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class ActionCollectionApplicationExportableServiceCEImpl extends ApplicationExportableUtilsImpl
        implements ArtifactBasedExportableServiceCE<ActionCollection, Application> {

    private final ActionCollectionService actionCollectionService;

    @Override
    public Flux<ActionCollection> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return actionCollectionService.findByPageIdsForExport(contextIds, permission);
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ActionCollection actionCollection,
            ResourceModes resourceMode) {

        actionCollection.setApplicationId(null);

        ActionCollectionDTO actionCollectionDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            actionCollectionDTO = actionCollection.getUnpublishedCollection();
        } else {
            actionCollectionDTO = actionCollection.getPublishedCollection();
        }
        actionCollectionDTO.setPageId(mappedExportableResourcesDTO
                .getContextIdToNameMap()
                .get(actionCollectionDTO.getPageId() + resourceMode));
        actionCollectionDTO.setPluginId(
                mappedExportableResourcesDTO.getPluginMap().get(actionCollectionDTO.getPluginId()));

        if (!mappedExportableResourcesDTO.getCollectionIdToNameMap().containsValue(actionCollection.getId())) {
            final String updatedCollectionId = actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
            mappedExportableResourcesDTO.getCollectionIdToNameMap().put(actionCollection.getId(), updatedCollectionId);
            actionCollection.setId(updatedCollectionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ActionCollectionDTO actionCollectionDTO = (ActionCollectionDTO) dtoObject;
        return actionCollectionDTO.getPageId();
    }
}
