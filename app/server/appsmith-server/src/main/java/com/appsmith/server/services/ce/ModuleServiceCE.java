package com.appsmith.server.services.ce;

import com.appsmith.external.models.ModuleDTO;
import com.appsmith.server.domains.Module;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

public interface ModuleServiceCE extends CrudService<Module, String> {
    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

}