package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleInstanceServiceCECompatible extends BaseModuleInstanceService {
    Mono<CreateModuleInstanceResponseDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO, String branchName);

    Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName);

    Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, ResourceModes resourceMode);

    Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId);
}
