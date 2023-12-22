package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface LayoutModuleInstanceCECompatibleService extends BaseModuleInstanceService {
    Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode, String branchName);

    Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission);

    Flux<ModuleInstance> findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission editPermission);

    Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId, String branchName, boolean isRefactor);
}
