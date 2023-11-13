package com.appsmith.server.modules.crud.entity;

import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.base.BaseModuleService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleEntityService extends BaseModuleService {
    Mono<ModuleActionDTO> updateModuleAction(ModuleActionDTO moduleActionDTO, String moduleId, String actionId);

    Mono<List<ModuleConsumable>> getModuleActions(String moduleId);
}
