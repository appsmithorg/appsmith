package com.appsmith.server.modules.services.crud;

import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.services.base.BaseModuleServiceCECompatible;
import reactor.core.publisher.Mono;

public interface CrudModuleServiceCECompatible extends BaseModuleServiceCECompatible {
    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

    Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId);
}
