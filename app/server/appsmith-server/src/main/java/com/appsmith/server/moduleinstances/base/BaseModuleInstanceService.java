package com.appsmith.server.moduleinstances.base;

import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import reactor.core.publisher.Mono;

public interface BaseModuleInstanceService {
    Mono<ModuleInstanceDTO> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
            ModuleInstance moduleInstance, ModuleInstanceDTO moduleInstanceDTO);

    Mono<ModuleInstanceDTO> generateModuleInstanceByViewMode(ModuleInstance moduleInstance, ResourceModes resourceMode);
}
