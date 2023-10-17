package com.appsmith.server.modules.services.crud;

import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.services.base.BaseModuleService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleService extends BaseModuleService, CrudModuleServiceCECompatible {
    Mono<List<ModuleDTO>> getAllModules(String packageId, ResourceModes resourceMode);

    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

    Mono<ModuleDTO> getModule(String moduleId);

    Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId);

    Mono<ModuleDTO> deleteModule(String moduleId);
}
