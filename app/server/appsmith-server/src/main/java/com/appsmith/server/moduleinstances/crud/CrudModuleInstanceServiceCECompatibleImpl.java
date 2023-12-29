package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

@Service
public class CrudModuleInstanceServiceCECompatibleImpl extends BaseModuleInstanceServiceImpl
        implements CrudModuleInstanceServiceCECompatible {
    public CrudModuleInstanceServiceCECompatibleImpl(ModuleInstanceRepository moduleInstanceRepository) {
        super(moduleInstanceRepository);
    }

    @Override
    public Mono<CreateModuleInstanceResponseDTO> createModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<SimulatedModuleInstanceDTO> simulateCreateModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName, Mono<Module> cachedModuleMono) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<CreateModuleInstanceResponseDTO> createOrphanModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, boolean viewMode) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<ModuleInstance> findByPageIds(
            List<String> unpublishedPages, Optional<AclPermission> optionalPermission) {
        return Flux.empty();
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedByOriginModuleIdOrModuleUUID(
            Module sourceModule, Optional<AclPermission> permission) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
