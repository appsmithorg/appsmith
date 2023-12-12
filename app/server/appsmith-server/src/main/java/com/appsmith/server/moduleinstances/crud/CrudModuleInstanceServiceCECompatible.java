package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CrudModuleInstanceServiceCECompatible extends BaseModuleInstanceService {
    Mono<CreateModuleInstanceResponseDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO, String branchName);

    Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName);

    Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, boolean viewMode);

    Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId);

    Flux<ModuleInstance> findByPageIds(List<String> unpublishedPages, Optional<AclPermission> optionalPermission);

    Flux<ModuleInstance> findAllUnpublishedByModuleUUID(String moduleUUID, Optional<AclPermission> permission);
}
