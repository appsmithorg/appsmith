package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class LayoutModuleInstanceCECompatibleServiceImpl extends BaseModuleInstanceServiceImpl
        implements LayoutModuleInstanceCECompatibleService {
    public LayoutModuleInstanceCECompatibleServiceImpl(ModuleInstanceRepository moduleInstanceRepository) {
        super(moduleInstanceRepository);
    }

    @Override
    public Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode, String branchName) {
        return Mono.empty();
    }

    @Override
    public Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission) {
        return Mono.empty();
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
            String pageId,
            CreatorContextType creatorContextType,
            String rootModuleInstanceId,
            AclPermission editPermission) {
        return Flux.empty();
    }

    @Override
    public Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId, String branchName, boolean isRefactor) {
        return Mono.empty();
    }
}
