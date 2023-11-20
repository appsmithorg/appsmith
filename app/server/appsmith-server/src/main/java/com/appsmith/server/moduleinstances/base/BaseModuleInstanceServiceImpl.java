package com.appsmith.server.moduleinstances.base;

import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import reactor.core.publisher.Mono;

public abstract class BaseModuleInstanceServiceImpl implements BaseModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;

    public BaseModuleInstanceServiceImpl(ModuleInstanceRepository moduleInstanceRepository) {
        this.moduleInstanceRepository = moduleInstanceRepository;
    }

    @Override
    public Mono<ModuleInstanceDTO> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
            ModuleInstance moduleInstance, ModuleInstanceDTO moduleInstanceDTO) {
        moduleInstanceDTO.setId(moduleInstance.getId());
        moduleInstanceDTO.setModuleUUID(moduleInstance.getModuleUUID());
        moduleInstanceDTO.setSourceModuleId(moduleInstance.getSourceModuleId());
        moduleInstanceDTO.setContextType(moduleInstance.getContextType());
        moduleInstanceDTO.setPageId(moduleInstance.getPageId());
        moduleInstanceDTO.setModuleId(moduleInstance.getModuleId());
        moduleInstanceDTO.setUserPermissions(moduleInstance.getUserPermissions());

        return Mono.just(moduleInstanceDTO);
    }

    @Override
    public Mono<ModuleInstanceDTO> generateModuleInstanceByViewMode(
            ModuleInstance moduleInstance, ResourceModes resourceMode) {
        ModuleInstanceDTO moduleInstanceDTO;
        if (moduleInstance.getDeletedAt() != null) {
            return Mono.empty();
        }

        if (resourceMode.equals(ResourceModes.EDIT)) {
            moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        } else {
            moduleInstanceDTO = moduleInstance.getPublishedModuleInstance();
        }

        return setTransientFieldsFromModuleInstanceToModuleInstanceDTO(moduleInstance, moduleInstanceDTO);
    }
}
