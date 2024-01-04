package com.appsmith.server.moduleinstances.base;

import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import reactor.core.publisher.Mono;

public interface BaseModuleInstanceService {
    Mono<ModuleInstanceDTO> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
            ModuleInstance moduleInstance, ModuleInstanceDTO moduleInstanceDTO);

    Mono<ModuleInstanceDTO> generateModuleInstanceByViewMode(ModuleInstance moduleInstance, ResourceModes resourceMode);

    void validateModuleInstanceDTO(ModuleInstanceDTO moduleInstanceDTO, boolean isOrphan);

    ModuleInstance extractAndSetJsonPathKeys(ModuleInstance moduleInstance);
}
