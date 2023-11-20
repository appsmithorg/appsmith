package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CrudModuleInstanceService extends BaseModuleInstanceService {
    Mono<ModuleInstanceDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO);

    Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode);

    Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId);

    Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName);
}
