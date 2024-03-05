package com.appsmith.server.moduleinstances.crud;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import reactor.core.publisher.Mono;

public interface CrudModuleInstanceService extends CrudModuleInstanceServiceCECompatible {

    Mono<ModuleInstance> createModuleInstanceAndReturn(ModuleInstanceDTO moduleInstanceReqDTO, String branchName);

    void generateAndSetModuleInstancePolicies(NewPage page, ModuleInstance moduleInstance);
}
