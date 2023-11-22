package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleInstanceService extends BaseModuleInstanceService {
    Mono<ModuleInstanceDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO);

    Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode);

    Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId);

    Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName);

    Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission);

    Flux<ModuleInstance> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String pageId,
            CreatorContextType creatorContextType,
            String moduleInstanceId,
            AclPermission editPermission);
}
