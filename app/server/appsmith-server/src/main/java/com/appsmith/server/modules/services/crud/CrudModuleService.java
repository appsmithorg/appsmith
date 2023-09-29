package com.appsmith.server.modules.services.crud;

import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.services.base.BaseModuleService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleService extends BaseModuleService, CrudModuleServiceCECompatible {
    Mono<List<ModuleDTO>> getAllModules(String packageId, ResourceModes resourceMode);
}
