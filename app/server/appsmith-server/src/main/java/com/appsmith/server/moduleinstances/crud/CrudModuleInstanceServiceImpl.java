package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import org.bson.types.ObjectId;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.services.ce.ApplicationPageServiceCEImpl.EVALUATION_VERSION;

@Service
public class CrudModuleInstanceServiceImpl extends CrudModuleInstanceServiceCECompatibleImpl
        implements CrudModuleInstanceService {

    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;
    private final NewPageService newPageService;
    private final PagePermission pagePermission;
    private final ModulePermission modulePermission;
    private final ActionPermission actionPermission;
    private final ModuleInstantiatingService<NewAction> actionModuleInstantiatingService;
    private final ModuleInstantiatingService<ModuleInstance> moduleInstanceModuleInstantiatingService;
    private final ModuleInstantiatingService<ActionCollection> actionCollectionModuleInstantiatingService;
    private final PolicyGenerator policyGenerator;
    private final TransactionalOperator transactionalOperator;
    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final RefactoringService refactoringService;

    private final ApplicationService applicationService;

    private final UpdateLayoutService updateLayoutService;

    public CrudModuleInstanceServiceImpl(
            ModuleInstanceRepository repository,
            ModuleInstancePermission moduleInstancePermission,
            NewPageService newPageService,
            PagePermission pagePermission,
            ModulePermission modulePermission,
            ActionPermission actionPermission,
            ModuleInstantiatingService<NewAction> actionModuleInstantiatingService,
            ModuleInstantiatingService<ModuleInstance> moduleInstanceModuleInstantiatingService,
            ModuleInstantiatingService<ActionCollection> actionCollectionModuleInstantiatingService,
            PolicyGenerator policyGenerator,
            TransactionalOperator transactionalOperator,
            ModuleRepository moduleRepository,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            RefactoringService refactoringService,
            ApplicationService applicationService,
            UpdateLayoutService updateLayoutService) {
        super(repository);
        this.repository = repository;
        this.moduleInstancePermission = moduleInstancePermission;
        this.newPageService = newPageService;
        this.pagePermission = pagePermission;
        this.modulePermission = modulePermission;
        this.actionPermission = actionPermission;
        this.actionModuleInstantiatingService = actionModuleInstantiatingService;
        this.moduleInstanceModuleInstantiatingService = moduleInstanceModuleInstantiatingService;
        this.actionCollectionModuleInstantiatingService = actionCollectionModuleInstantiatingService;
        this.policyGenerator = policyGenerator;
        this.transactionalOperator = transactionalOperator;
        this.moduleRepository = moduleRepository;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.refactoringService = refactoringService;
        this.applicationService = applicationService;
        this.updateLayoutService = updateLayoutService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<CreateModuleInstanceResponseDTO> createModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName) {
        validateModuleInstanceDTO(moduleInstanceReqDTO);
        Mono<Module> sourceModuleMono = moduleRepository
                .findById(
                        moduleInstanceReqDTO.getSourceModuleId(), modulePermission.getCreateModuleInstancePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.MODULE_ID,
                        moduleInstanceReqDTO.getSourceModuleId())));

        final HashMap<String, RefactorEntityNameDTO> sourceToInstantiatedEntityRefactorDTOsMap = new HashMap<>();

        Mono<Set<RefactorEntityNameDTO>> refactorDTOsForAllExistingEntitiesMono =
                refactoringService.getRefactorDTOsForAllExistingEntitiesMono(
                        moduleInstanceReqDTO.getSourceModuleId(), CreatorContextType.MODULE, null, false);

        Mono<Set<RefactorEntityNameDTO>> updateEntityNamesMapMono =
                refactorDTOsForAllExistingEntitiesMono.doOnNext(refactorEntityNameDTOS -> {
                    refactorEntityNameDTOS.forEach(refactorEntityNameDTO -> {
                        String newName = ModuleUtils.getValidName(
                                moduleInstanceReqDTO.getName(), refactorEntityNameDTO.getOldFullyQualifiedName());
                        refactorEntityNameDTO.setNewFullyQualifiedName(newName);

                        sourceToInstantiatedEntityRefactorDTOsMap.put(
                                refactorEntityNameDTO.getOldFullyQualifiedName(), refactorEntityNameDTO);
                    });

                    RefactorEntityNameDTO inputsRefactorDTO = new RefactorEntityNameDTO();
                    inputsRefactorDTO.setOldFullyQualifiedName("inputs");
                    inputsRefactorDTO.setNewFullyQualifiedName(moduleInstanceReqDTO.getName() + ".inputs");
                    sourceToInstantiatedEntityRefactorDTOsMap.put("inputs", inputsRefactorDTO);
                });

        return updateEntityNamesMapMono.then(sourceModuleMono).flatMap(sourceModule -> {
            ModuleInstance moduleInstance = new ModuleInstance();
            moduleInstance.setType(sourceModule.getType());
            moduleInstance.setId(new ObjectId().toString());
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO = new ModuleInstantiatingMetaDTO();
            moduleInstantiatingMetaDTO.setOldToNewModuleEntityRefactorDTOsMap(
                    sourceToInstantiatedEntityRefactorDTOsMap);

            return getNewPageMono(moduleInstanceReqDTO.getContextId(), branchName)
                    .flatMap(page -> {
                        Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                        return refactoringService
                                .isNameAllowed(
                                        page.getId(),
                                        CreatorContextType.PAGE,
                                        layout.getId(),
                                        moduleInstanceReqDTO.getName())
                                .flatMap(allowed -> {
                                    if (!allowed) {
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                                moduleInstanceReqDTO.getName(),
                                                FieldName.NAME));
                                    }
                                    return Mono.just(page);
                                });
                    })
                    .flatMap(page -> {
                        moduleInstance.setApplicationId(page.getApplicationId());
                        moduleInstance.setSourceModuleId(sourceModule.getId());
                        moduleInstance.setModuleUUID(sourceModule.getModuleUUID());
                        moduleInstance.setContextType(moduleInstanceReqDTO.getContextType());

                        this.setContextId(
                                moduleInstance,
                                moduleInstanceReqDTO.getContextId(),
                                moduleInstanceReqDTO.getContextType());

                        ModuleInstanceDTO unpublishedModuleInstanceDTO = prepareUnpublishedModuleInstanceFromRequest(
                                moduleInstanceReqDTO, sourceModule.getPublishedModule());
                        moduleInstance.setUnpublishedModuleInstance(unpublishedModuleInstanceDTO);
                        moduleInstance.setPublishedModuleInstance(new ModuleInstanceDTO());

                        DefaultResources defaultResources = new DefaultResources();
                        defaultResources.setBranchName(branchName);
                        defaultResources.setModuleInstanceId(moduleInstance.getId());
                        defaultResources.setPageId(moduleInstanceReqDTO.getContextId());

                        moduleInstance.setDefaultResources(defaultResources);

                        moduleInstantiatingMetaDTO.setRootModuleInstanceId(moduleInstance.getId());
                        moduleInstantiatingMetaDTO.setRootModuleInstanceName(moduleInstanceReqDTO.getName());
                        moduleInstantiatingMetaDTO.setContextType(moduleInstanceReqDTO.getContextType());
                        moduleInstantiatingMetaDTO.setContextId(moduleInstanceReqDTO.getContextId());
                        moduleInstantiatingMetaDTO.setSourceModuleId(sourceModule.getId());
                        moduleInstantiatingMetaDTO.setPage(page);

                        Set<Policy> policies = policyGenerator.getAllChildPolicies(
                                page.getPolicies(), Page.class, ModuleInstance.class);

                        moduleInstance.setPolicies(policies);

                        extractAndSetJsonPathKeys(moduleInstance);

                        Mono<Integer> evalVersionMono = applicationService
                                .findById(page.getApplicationId())
                                .map(application -> {
                                    Integer evaluationVersion = application.getEvaluationVersion();
                                    if (evaluationVersion == null) {
                                        evaluationVersion = EVALUATION_VERSION;
                                    }
                                    return evaluationVersion;
                                })
                                .cache();

                        moduleInstantiatingMetaDTO.setEvalVersionMono(evalVersionMono);

                        return repository
                                .save(moduleInstance)
                                .flatMap(repository::setUserPermissionsInObject)
                                .flatMap(savedModuleInstance -> moduleInstanceModuleInstantiatingService
                                        .instantiateEntities(moduleInstantiatingMetaDTO)
                                        .then(actionModuleInstantiatingService.instantiateEntities(
                                                moduleInstantiatingMetaDTO))
                                        .then(actionCollectionModuleInstantiatingService.instantiateEntities(
                                                moduleInstantiatingMetaDTO))
                                        .then(generateModuleInstanceByViewMode(savedModuleInstance, ResourceModes.EDIT)
                                                .flatMap(createdModuleInstance -> {
                                                    Flux<NewAction> actionFlux =
                                                            newActionService
                                                                    .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                                                                            savedModuleInstance.getId(),
                                                                            actionPermission.getExecutePermission(),
                                                                            false);
                                                    Flux<ActionCollection> actionCollectionFlux =
                                                            actionCollectionService
                                                                    .findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
                                                                            moduleInstance.getId(),
                                                                            actionPermission.getExecutePermission());

                                                    // TODO: Serve all the related custom JS libs here
                                                    return getModuleInstanceEntitiesDTOMono(
                                                                    actionFlux, actionCollectionFlux)
                                                            .flatMap(moduleInstanceEntitiesDTO -> {
                                                                final CreateModuleInstanceResponseDTO
                                                                        createModuleInstanceResponseDTO =
                                                                                new CreateModuleInstanceResponseDTO();
                                                                createModuleInstanceResponseDTO.setModuleInstance(
                                                                        createdModuleInstance);
                                                                createModuleInstanceResponseDTO.setEntities(
                                                                        moduleInstanceEntitiesDTO);

                                                                return Mono.just(createModuleInstanceResponseDTO);
                                                            });
                                                })))
                                .as(transactionalOperator::transactional)
                                .flatMap(createdModuleInstance -> updateLayoutService
                                        .updatePageLayoutsByPageId(page.getId())
                                        .thenReturn(createdModuleInstance));
                    });
        });
    }

    private void setContextId(ModuleInstance moduleInstance, String contextId, CreatorContextType contextType) {
        if (contextType == CreatorContextType.PAGE) {
            moduleInstance.setPageId(contextId);
            moduleInstance.setModuleId(null);
        } else if (contextType == CreatorContextType.MODULE) {
            moduleInstance.setModuleId(contextId);
            moduleInstance.setPageId(contextId);
        } else {
            throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
        }
    }

    private ModuleInstanceDTO prepareUnpublishedModuleInstanceFromRequest(
            ModuleInstanceDTO moduleInstanceReqDTO, ModuleDTO sourceModuleDTO) {
        ModuleInstanceDTO moduleInstanceDTO = new ModuleInstanceDTO();
        moduleInstanceDTO.setName(moduleInstanceReqDTO.getName());

        Map<String, String> inputs = transformModuleInputsToModuleInstance(sourceModuleDTO);
        moduleInstanceDTO.setInputs(inputs);

        return moduleInstanceDTO;
    }

    private Mono<NewPage> getNewPageMono(String pageId, String branchName) {
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, pageId, pagePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE_ID, pageId)));
    }

    @NotNull private Map<String, String> transformModuleInputsToModuleInstance(ModuleDTO moduleDTO) {
        if (moduleDTO.getInputsForm() == null || moduleDTO.getInputsForm().isEmpty()) {
            return Map.of();
        }
        return moduleDTO.getInputsForm().get(0).getChildren().stream()
                .collect(Collectors.toMap(
                        moduleInput -> moduleInput.getLabel(), // `label` is supposed to be unique
                        moduleInput -> moduleInput.getDefaultValue()));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName) {
        Mono<ModuleInstance> branchedModuleInstanceMono = repository
                .findByBranchNameAndDefaultModuleInstanceId(
                        branchName, defaultModuleInstanceId, moduleInstancePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE_ID, defaultModuleInstanceId)));

        return branchedModuleInstanceMono
                .flatMap(moduleInstance -> {
                    if (moduleInstance.getPublishedModuleInstance() != null
                            && moduleInstance.getPublishedModuleInstance().getName() != null) {
                        // This module instance was published before. So, the entire document should not be deleted
                        // instead the unpublished module instance should be deleted. This applies to all of its
                        // composed entities e.g. newAction, actionCollection
                        moduleInstance.getUnpublishedModuleInstance().setDeletedAt(Instant.now());
                        return newActionService
                                .archiveActionsByRootModuleInstanceId(moduleInstance.getId())
                                .then(actionCollectionService.archiveActionCollectionsByRootModuleInstanceId(
                                        moduleInstance.getId()))
                                .then(repository
                                        .save(moduleInstance)
                                        .flatMap(deletedModuleInstance ->
                                                setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
                                                        deletedModuleInstance,
                                                        deletedModuleInstance.getUnpublishedModuleInstance())));
                    }

                    // This module instance was never published. It can be safely archived along with its composed
                    // entities.
                    return newActionService
                            .archiveActionsByRootModuleInstanceId(moduleInstance.getId())
                            .then(actionCollectionService.archiveActionCollectionsByRootModuleInstanceId(
                                    moduleInstance.getId()))
                            .then(this.archiveModuleInstancesByRootModuleInstanceId(moduleInstance.getId()))
                            // TODO: Delete all the related custom JS libs here
                            .then(repository
                                    .archive(moduleInstance)
                                    .flatMap(deletedModuleInstance ->
                                            setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
                                                    deletedModuleInstance,
                                                    deletedModuleInstance.getUnpublishedModuleInstance())));
                })
                .as(transactionalOperator::transactional)
                .flatMap(deletedModuleInstance -> {
                    if (CreatorContextType.PAGE.equals(deletedModuleInstance.getContextType())) {
                        return updateLayoutService
                                .updatePageLayoutsByPageId(deletedModuleInstance.getContextId())
                                .thenReturn(deletedModuleInstance);
                    }
                    return Mono.just(deletedModuleInstance);
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, ResourceModes resourceMode) {

        AclPermission permission = resourceMode == ResourceModes.VIEW
                ? actionPermission.getExecutePermission()
                : actionPermission.getEditPermission();
        Flux<NewAction> actionFlux = newActionService.findAllActionsByContextIdAndContextTypeAndViewMode(
                contextId, contextType, permission, false, false);

        Flux<ActionCollection> actionCollectionFlux =
                actionCollectionService.findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
                        contextId, contextType, permission, false);

        return getModuleInstanceEntitiesDTOMono(actionFlux, actionCollectionFlux);
    }

    @NotNull private Mono<ModuleInstanceEntitiesDTO> getModuleInstanceEntitiesDTOMono(
            Flux<NewAction> actionFlux, Flux<ActionCollection> actionCollectionFlux) {
        final ModuleInstanceEntitiesDTO moduleInstanceEntitiesDTO = new ModuleInstanceEntitiesDTO();

        Mono<List<ActionViewDTO>> actionsMono = actionFlux
                .map(newAction -> newActionService.generateActionViewDTO(newAction, newAction.getUnpublishedAction()))
                .collectList();

        Mono<List<ActionCollectionDTO>> actionCollectionsMono = actionCollectionFlux
                .flatMap(actionCollection ->
                        actionCollectionService.generateActionCollectionByViewMode(actionCollection, false))
                .collectList();

        return actionsMono.zipWith(actionCollectionsMono).flatMap(tuple2 -> {
            List<ActionViewDTO> actions = tuple2.getT1();
            moduleInstanceEntitiesDTO.setActions(actions);
            List<ActionCollectionDTO> actionCollections = tuple2.getT2();

            List<String> collectionIds = actionCollections.stream()
                    .map(actionCollection -> actionCollection.getId())
                    .collect(Collectors.toList());

            Map<String, ActionCollectionDTO> collectionIdToActionCollectionMap = actionCollections.stream()
                    .collect(Collectors.toMap(
                            actionCollection -> actionCollection.getId(), actionCollection -> actionCollection));

            return newActionService
                    .findAllJSActionsByCollectionIds(collectionIds, null)
                    .flatMap(jsAction -> newActionService.generateActionByViewMode(jsAction, false))
                    .map(actionDTO -> {
                        ActionCollectionDTO actionCollectionDTO =
                                collectionIdToActionCollectionMap.get(actionDTO.getCollectionId());
                        actionCollectionDTO.getActions().add(actionDTO);

                        return actionCollectionDTO;
                    })
                    .collectList()
                    .flatMap(actionCollectionDTOs -> {
                        moduleInstanceEntitiesDTO.setJsCollections(actionCollectionDTOs);
                        return Mono.just(moduleInstanceEntitiesDTO);
                    });
        });
    }

    @Override
    public Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId) {
        return repository
                .findAllByRootModuleInstanceId(
                        rootModuleInstanceId, Optional.of(moduleInstancePermission.getDeletePermission()))
                .flatMap(composedModuleInstance -> {
                    if (composedModuleInstance.getPublishedModuleInstance() != null
                            && composedModuleInstance
                                            .getPublishedModuleInstance()
                                            .getContextType()
                                    != null) {
                        composedModuleInstance.getUnpublishedModuleInstance().setDeletedAt(Instant.now());
                        return repository.save(composedModuleInstance);
                    }
                    return repository.archive(composedModuleInstance);
                })
                .collectList();
    }
}
