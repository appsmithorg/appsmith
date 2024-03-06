package com.appsmith.server.moduleinstances.exportable.packages;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.packages.exportable.utils.PackageExportableUtilsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
public class ModuleInstancePackageExportableServiceImpl extends PackageExportableUtilsImpl
        implements ArtifactBasedExportableService<ModuleInstance, Package> {

    private final CrudModuleInstanceService crudModuleInstanceService;

    @Override
    public Flux<ModuleInstance> findByContextIdsForExport(List<String> contextIds, AclPermission permission) {
        return crudModuleInstanceService.getByContextTypeAndContextIds(
                CreatorContextType.MODULE, contextIds, permission);
    }

    @Override
    public void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ModuleInstance moduleInstance,
            ResourceModes resourceMode) {

        ModuleInstanceDTO moduleInstanceDTO;
        if (ResourceModes.EDIT.equals(resourceMode)) {
            moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        } else {
            moduleInstanceDTO = moduleInstance.getPublishedModuleInstance();
        }
        moduleInstanceDTO.setPageId(mappedExportableResourcesDTO
                .getContextIdToNameMap()
                .get(moduleInstanceDTO.getModuleId() + resourceMode));

        if (!mappedExportableResourcesDTO.getModuleInstanceIdToNameMap().containsValue(moduleInstance.getId())) {
            final String updatedActionId = moduleInstanceDTO.getModuleId() + "_" + moduleInstanceDTO.getName();
            mappedExportableResourcesDTO.getModuleInstanceIdToNameMap().put(moduleInstance.getId(), updatedActionId);
            moduleInstance.setId(updatedActionId);
        }
    }

    @Override
    public String getContextNameAtIdReference(Object dtoObject) {
        ModuleInstanceDTO moduleInstanceDTO = (ModuleInstanceDTO) dtoObject;
        return moduleInstanceDTO.getModuleId();
    }
}
