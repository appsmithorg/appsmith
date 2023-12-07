package com.appsmith.server.modules.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.modules.base.BaseModuleServiceCECompatible;
import reactor.core.publisher.Mono;

public interface CrudModuleServiceCECompatible extends BaseModuleServiceCECompatible {
    Mono<ModuleDTO> createModule(ModuleDTO moduleDTO);

    Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId);

    Mono<ActionDTO> createPrivateModuleAction(ActionDTO action, String branchName);

    Mono<ActionCollectionDTO> createPrivateModuleActionCollection(
            ActionCollectionDTO actionCollectionDTO, String branchName);
}
