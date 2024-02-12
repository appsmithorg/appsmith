package com.appsmith.server.moduleinstances.exportable.applications;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.exportable.utils.ApplicationExportableUtilsImpl;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class ModuleInstanceApplicationExportableServiceImpl extends ApplicationExportableUtilsImpl
        implements ArtifactBasedExportableService<ModuleInstance, Application> {

    private final CrudModuleInstanceService crudModuleInstanceService;

    @Override
    public Flux<ModuleInstance> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return crudModuleInstanceService.findByPageIds(contextIds, Optional.ofNullable(permission));
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ModuleInstance moduleInstance,
            ResourceModes resourceMode) {

        moduleInstance.setApplicationId(null);

        ModuleInstanceDTO moduleInstanceDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        } else {
            moduleInstanceDTO = moduleInstance.getPublishedModuleInstance();
        }
        moduleInstanceDTO.setPageId(
                mappedExportableResourcesDTO.getContextIdToNameMap().get(moduleInstanceDTO.getPageId() + resourceMode));

        if (!mappedExportableResourcesDTO.getModuleInstanceIdToNameMap().containsValue(moduleInstance.getId())) {
            final String updatedModuleInstanceId = moduleInstanceDTO.getPageId() + "_" + moduleInstanceDTO.getName();
            mappedExportableResourcesDTO
                    .getModuleInstanceIdToNameMap()
                    .put(moduleInstance.getId(), updatedModuleInstanceId);
            moduleInstance.setId(updatedModuleInstanceId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ModuleInstanceDTO moduleInstanceDTO = (ModuleInstanceDTO) dtoObject;
        return moduleInstanceDTO.getPageId();
    }
}
