package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CrudModuleInstanceServiceCECompatible extends BaseModuleInstanceService {

    /**
     * Creates a new Module Instance based on the provided ModuleInstanceDTO
     * and associates it with the specified branch.
     *
     * @param moduleInstanceDTO The ModuleInstanceDTO containing data for the new module instance
     * @param branchName        The name of the branch to associate the new module instance with
     * @return A Mono emitting the response DTO for the created module instance
     */
    Mono<CreateModuleInstanceResponseDTO> createModuleInstance(ModuleInstanceDTO moduleInstanceDTO, String branchName);

    /**
     * Simulates the creation of a new Module Instance without actually creating it.
     * This method is used for simulation purposes and requires a cached Module Mono.
     *
     * @param moduleInstanceReqDTO The ModuleInstanceDTO to simulate creation for
     * @param branchName            The name of the branch to simulate the creation in
     * @param cachedModuleMono      A Mono emitting the cached Module
     * @return A Mono emitting the simulated ModuleInstanceDTO
     */
    Mono<SimulatedModuleInstanceDTO> simulateCreateModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName, Mono<Module> cachedModuleMono);

    /**
     * Creates an orphan Module Instance that is not associated with any specific module.
     *
     * @param moduleInstanceReqDTO The ModuleInstance containing data for the orphan module instance
     * @param branchName           The name of the branch to associate the orphan module instance with
     * @return A Mono emitting the response DTO for the created orphan module instance
     */
    Mono<CreateModuleInstanceResponseDTO> createOrphanModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName);

    Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName);

    Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, boolean viewMode);

    Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId);

    Flux<ModuleInstance> findByPageIds(List<String> unpublishedPages, Optional<AclPermission> optionalPermission);

    Flux<ModuleInstance> findAllUnpublishedByOriginModuleIdOrModuleUUID(
            Module sourceModule, Optional<AclPermission> permission);
}
