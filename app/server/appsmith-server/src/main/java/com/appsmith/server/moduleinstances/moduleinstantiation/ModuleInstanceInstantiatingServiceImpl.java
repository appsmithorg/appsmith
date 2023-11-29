package com.appsmith.server.moduleinstances.moduleinstantiation;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.helpers.ModuleUtils;
import com.appsmith.server.moduleinstances.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

@Service
public class ModuleInstanceInstantiatingServiceImpl extends BaseModuleInstanceServiceImpl
        implements ModuleInstantiatingService<ModuleInstance> {
    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringService;

    public ModuleInstanceInstantiatingServiceImpl(
            ModuleInstanceRepository repository,
            ModuleInstancePermission moduleInstancePermission,
            PolicyGenerator policyGenerator,
            RefactoringService refactoringService) {
        super(repository);
        this.repository = repository;
        this.moduleInstancePermission = moduleInstancePermission;
        this.policyGenerator = policyGenerator;
        this.refactoringService = refactoringService;
    }

    @Override
    public Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        Flux<ModuleInstance> allModuleInstancesFlux = repository.findAllByContextIdAndContextType(
                moduleInstantiatingMetaDTO.getSourceModuleId(),
                CreatorContextType.MODULE,
                moduleInstancePermission.getReadPermission());
        return allModuleInstancesFlux
                .flatMap(sourceModuleInstance -> {
                    ModuleInstance toBeInstantiatedModuleInstance =
                            createNewModuleInstanceFromSource(sourceModuleInstance);
                    setUnpublishedAndPublishedData(sourceModuleInstance, toBeInstantiatedModuleInstance);
                    setContextTypeAndContextId(toBeInstantiatedModuleInstance, moduleInstantiatingMetaDTO);
                    toBeInstantiatedModuleInstance.setRootModuleInstanceId(
                            moduleInstantiatingMetaDTO.getRootModuleInstanceId());

                    ModuleInstanceDTO unpublishedModuleInstance =
                            toBeInstantiatedModuleInstance.getUnpublishedModuleInstance();
                    setFullyQualifiedName(moduleInstantiatingMetaDTO, unpublishedModuleInstance);

                    setPolicies(moduleInstantiatingMetaDTO, toBeInstantiatedModuleInstance);

                    setDefaultResources(
                            moduleInstantiatingMetaDTO,
                            sourceModuleInstance,
                            unpublishedModuleInstance,
                            toBeInstantiatedModuleInstance);

                    moduleInstantiatingMetaDTO
                            .getOldToNewModuleInstanceIdMap()
                            .put(sourceModuleInstance.getId(), toBeInstantiatedModuleInstance.getId());

                    Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap =
                            moduleInstantiatingMetaDTO.getOldToNewModuleEntityRefactorDTOsMap();

                    Mono<ModuleInstance> moduleInstanceMono = refactorAndExtractJsonPathKeysForModuleInstance(
                            toBeInstantiatedModuleInstance,
                            unpublishedModuleInstance,
                            moduleInstantiatingMetaDTO,
                            oldToNewModuleEntityRefactorDTOsMap);

                    return moduleInstanceMono;
                })
                .collectList()
                .flatMap(toBeInstantiatedModuleInstances ->
                        repository.saveAll(toBeInstantiatedModuleInstances).then());
    }

    private Mono<ModuleInstance> refactorAndExtractJsonPathKeysForModuleInstance(
            ModuleInstance toBeInstantiatedModuleInstance,
            ModuleInstanceDTO unpublishedModuleInstance,
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            Map<String, RefactorEntityNameDTO> oldToNewModuleEntityRefactorDTOsMap) {

        // For each entity name, call refactor current entity
        Mono<ModuleInstance> moduleInstanceMono = Flux.fromIterable(oldToNewModuleEntityRefactorDTOsMap.values())
                .concatMap(refactorEntityNameDTO -> refactoringService.refactorCurrentEntity(
                        unpublishedModuleInstance,
                        EntityType.MODULE_INSTANCE,
                        refactorEntityNameDTO,
                        moduleInstantiatingMetaDTO.getEvalVersionMono()))
                .then(Mono.defer(() -> {
                    // After all refactors, call extractAndSetJsonPathKeys for the current entity
                    this.extractAndSetJsonPathKeys(toBeInstantiatedModuleInstance);
                    return Mono.just(toBeInstantiatedModuleInstance);
                }));

        return moduleInstanceMono;
    }

    private void setFullyQualifiedName(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ModuleInstanceDTO unpublishedModuleInstance) {
        unpublishedModuleInstance.setName(ModuleUtils.getValidName(
                moduleInstantiatingMetaDTO.getRootModuleInstanceName(), unpublishedModuleInstance.getName()));
    }

    private void setUnpublishedAndPublishedData(
            ModuleInstance sourceModuleInstance, ModuleInstance toBeInstantiatedModuleInstance) {
        toBeInstantiatedModuleInstance.setUnpublishedModuleInstance(sourceModuleInstance.getPublishedModuleInstance());
        toBeInstantiatedModuleInstance.setPublishedModuleInstance(new ModuleInstanceDTO());
    }

    private ModuleInstance createNewModuleInstanceFromSource(ModuleInstance sourceModuleInstance) {
        // Create a new module instance to be instantiated
        ModuleInstance toBeInstantiatedModuleInstance = new ModuleInstance();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceModuleInstance, toBeInstantiatedModuleInstance);
        toBeInstantiatedModuleInstance.setId(new ObjectId().toString());
        return toBeInstantiatedModuleInstance;
    }

    private void setDefaultResources(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            ModuleInstance sourceModuleInstance,
            ModuleInstanceDTO unpublishedModuleInstance,
            ModuleInstance toBeInstantiatedModuleInstance) {
        // Set relevant default resources
        DefaultResources defaultResources = sourceModuleInstance.getDefaultResources();
        defaultResources.setBranchName(moduleInstantiatingMetaDTO.getBranchName());
        defaultResources.setModuleInstanceId(unpublishedModuleInstance.getId());
        defaultResources.setPageId(
                moduleInstantiatingMetaDTO.getPage().getDefaultResources().getPageId());

        toBeInstantiatedModuleInstance.setDefaultResources(defaultResources);
    }

    private void setPolicies(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO, ModuleInstance toBeInstantiatedModuleInstance) {
        // Set policies to the new module instance
        Set<Policy> moduleInstancePolicies = policyGenerator.getAllChildPolicies(
                moduleInstantiatingMetaDTO.getPage().getPolicies(), Page.class, ModuleInstance.class);

        toBeInstantiatedModuleInstance.setPolicies(moduleInstancePolicies);
    }

    private void setContextTypeAndContextId(
            ModuleInstance toBeInstantiatedModuleInstance, ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO) {
        toBeInstantiatedModuleInstance.setContextType(moduleInstantiatingMetaDTO.getContextType());
        // Set the value of `contextId` to the respective field based on the `contextType`
        if (CreatorContextType.PAGE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            toBeInstantiatedModuleInstance.setApplicationId(
                    moduleInstantiatingMetaDTO.getPage().getApplicationId());
            toBeInstantiatedModuleInstance.setPageId(moduleInstantiatingMetaDTO.getContextId());
            toBeInstantiatedModuleInstance.setModuleId(null);
        } else if (CreatorContextType.MODULE.equals(moduleInstantiatingMetaDTO.getContextType())) {
            toBeInstantiatedModuleInstance.setModuleId(moduleInstantiatingMetaDTO.getContextId());
            toBeInstantiatedModuleInstance.setPageId(null);
            // TODO: Add packageId
        }
    }
}
