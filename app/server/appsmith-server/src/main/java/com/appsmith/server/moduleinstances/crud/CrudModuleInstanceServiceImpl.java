package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.moduleinstantiation.JSActionType;
import com.appsmith.server.moduleinstantiation.ModuleInstantiatingService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.modules.helpers.ModuleUtils.transformModuleInputsToModuleInstance;
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
    private final ModuleInstantiatingService<NewAction, NewAction> actionModuleInstantiatingService;
    private final ModuleInstantiatingService<ModuleInstance, ModuleInstance> moduleInstanceModuleInstantiatingService;
    private final ModuleInstantiatingService<ActionCollection, ActionCollection>
            actionCollectionModuleInstantiatingService;
    private final ModuleInstantiatingService<JSActionType, NewAction> jsActionModuleInstantiatingService;
    private final ModuleInstantiatingService<CustomJSLib, CustomJSLib> jsLibModuleInstantiatingService;
    private final PolicyGenerator policyGenerator;
    private final TransactionalOperator transactionalOperator;
    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final RefactoringService refactoringService;
    private final ApplicationService applicationService;
    private final UpdateLayoutService updateLayoutService;
    private final PackageRepository packageRepository;
    private final DefaultResourcesService<ModuleInstance> defaultResourcesService;
    private final DefaultResourcesService<ModuleInstanceDTO> dtoDefaultResourcesService;
    private final ResponseUtils responseUtils;

    public CrudModuleInstanceServiceImpl(
            ModuleInstanceRepository repository,
            ModuleInstancePermission moduleInstancePermission,
            NewPageService newPageService,
            PagePermission pagePermission,
            ModulePermission modulePermission,
            ActionPermission actionPermission,
            ModuleInstantiatingService<NewAction, NewAction> actionModuleInstantiatingService,
            ModuleInstantiatingService<ModuleInstance, ModuleInstance> moduleInstanceModuleInstantiatingService,
            ModuleInstantiatingService<ActionCollection, ActionCollection> actionCollectionModuleInstantiatingService,
            ModuleInstantiatingService<JSActionType, NewAction> jsActionModuleInstantiatingService,
            ModuleInstantiatingService<CustomJSLib, CustomJSLib> jsLibModuleInstantiatingService,
            PolicyGenerator policyGenerator,
            TransactionalOperator transactionalOperator,
            ModuleRepository moduleRepository,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            RefactoringService refactoringService,
            ApplicationService applicationService,
            UpdateLayoutService updateLayoutService,
            PackageRepository packageRepository,
            DefaultResourcesService<ModuleInstance> defaultResourcesService,
            DefaultResourcesService<ModuleInstanceDTO> dtoDefaultResourcesService,
            ResponseUtils responseUtils) {
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
        this.jsActionModuleInstantiatingService = jsActionModuleInstantiatingService;
        this.jsLibModuleInstantiatingService = jsLibModuleInstantiatingService;
        this.policyGenerator = policyGenerator;
        this.transactionalOperator = transactionalOperator;
        this.moduleRepository = moduleRepository;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.refactoringService = refactoringService;
        this.applicationService = applicationService;
        this.updateLayoutService = updateLayoutService;
        this.packageRepository = packageRepository;
        this.defaultResourcesService = defaultResourcesService;
        this.dtoDefaultResourcesService = dtoDefaultResourcesService;
        this.responseUtils = responseUtils;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<CreateModuleInstanceResponseDTO> createModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName) {
        validateModuleInstanceDTO(moduleInstanceReqDTO, false);
        Mono<Module> sourceModuleMono = moduleRepository
                .findById(
                        moduleInstanceReqDTO.getSourceModuleId(), modulePermission.getCreateModuleInstancePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.MODULE_ID,
                        moduleInstanceReqDTO.getSourceModuleId())));

        final ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO = new ModuleInstantiatingMetaDTO();
        moduleInstantiatingMetaDTO.setBranchName(branchName);

        Mono<NewPage> cachedNewPageMono =
                getNewPageMono(moduleInstanceReqDTO, branchName).cache();

        return cachedNewPageMono
                .zipWhen(page -> generateModuleInstance(
                        moduleInstanceReqDTO,
                        branchName,
                        sourceModuleMono,
                        moduleInstantiatingMetaDTO,
                        cachedNewPageMono))
                .flatMap(tuple2 -> {
                    NewPage page = tuple2.getT1();
                    ModuleInstance moduleInstance = tuple2.getT2();
                    return repository
                            .save(moduleInstance)
                            .flatMap(repository::setUserPermissionsInObject)
                            .flatMap(savedModuleInstance -> moduleInstanceModuleInstantiatingService
                                    .instantiateEntities(moduleInstantiatingMetaDTO)
                                    .then(actionModuleInstantiatingService.instantiateEntities(
                                            moduleInstantiatingMetaDTO))
                                    .then(actionCollectionModuleInstantiatingService.instantiateEntities(
                                            moduleInstantiatingMetaDTO))
                                    .then(jsLibModuleInstantiatingService.instantiateEntities(
                                            moduleInstantiatingMetaDTO))
                                    .then(generateModuleInstanceByViewMode(savedModuleInstance, ResourceModes.EDIT)
                                            .map(responseUtils::updateModuleInstanceDTOWithDefaultResources)
                                            .flatMap(createdModuleInstance -> {
                                                Mono<List<ActionViewDTO>> actionListMono = newActionService
                                                        .findAllUnpublishedComposedActionViewDTOsByRootModuleInstanceId(
                                                                savedModuleInstance.getId(),
                                                                actionPermission.getExecutePermission(),
                                                                false)
                                                        .collectList();
                                                Mono<List<ActionCollectionDTO>> collectionListMono =
                                                        actionCollectionService
                                                                .findAllUnpublishedComposedActionCollectionDTOsByRootModuleInstanceId(
                                                                        savedModuleInstance.getId(),
                                                                        actionPermission.getExecutePermission())
                                                                .collectList();

                                                return getModuleInstanceEntitiesDTOMono(
                                                                actionListMono, collectionListMono, false)
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
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<SimulatedModuleInstanceDTO> simulateCreateModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName, Mono<Module> cachedModuleMono) {

        final ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO = new ModuleInstantiatingMetaDTO();
        moduleInstantiatingMetaDTO.setBranchName(branchName);
        moduleInstantiatingMetaDTO.setSimulation(true);

        Mono<NewPage> cachedNewPageMono =
                getNewPageMono(moduleInstanceReqDTO, branchName).cache();

        return generateModuleInstance(
                        moduleInstanceReqDTO,
                        branchName,
                        cachedModuleMono,
                        moduleInstantiatingMetaDTO,
                        cachedNewPageMono)
                .flatMap(moduleInstance -> {
                    Mono<Map<String, ModuleInstance>> moduleInstanceListMono = moduleInstanceModuleInstantiatingService
                            .generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                            .flatMapIterable(list -> list)
                            .collectMap(ModuleInstance::getOriginModuleInstanceId, moduleInstance1 -> moduleInstance1);

                    Mono<Map<String, NewAction>> actionListMono = actionModuleInstantiatingService
                            .generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                            .flatMapIterable(list -> list)
                            .collectMap(NewAction::getOriginActionId, newAction -> newAction);

                    Mono<Map<String, ActionCollection>> collectionListMono = actionCollectionModuleInstantiatingService
                            .generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                            .flatMapIterable(list -> list)
                            .collectMap(
                                    ActionCollection::getOriginActionCollectionId, actionCollection -> actionCollection)
                            .zipWhen(actionCollections -> jsActionModuleInstantiatingService
                                    .generateInstantiatedEntities(moduleInstantiatingMetaDTO)
                                    .map(jsActionsList -> jsActionsList.stream()
                                            .collect(Collectors.toMap(
                                                    jsAction -> jsAction.getId(), jsAction -> jsAction))))
                            .map(tuple2 -> {
                                Map<String, ActionCollection> originCollectionIdToCollectionMap = tuple2.getT1();
                                Map<String, NewAction> jsActionMap = tuple2.getT2();

                                originCollectionIdToCollectionMap.values().forEach(actionCollection -> {
                                    Map<String, List<String>> collectionIdToActionIdsMap =
                                            moduleInstantiatingMetaDTO.getNewCollectionIdToNewActionIdsMap();

                                    List<String> actionIds = collectionIdToActionIdsMap.get(actionCollection.getId());
                                    ArrayList<ActionDTO> actions = new ArrayList<>();
                                    actionIds.stream().forEach(actionId -> {
                                        NewAction newAction = jsActionMap.get(actionId);
                                        if (newAction != null) {
                                            actions.add(newAction.getUnpublishedAction());
                                        }
                                    });

                                    actionCollection.getUnpublishedCollection().setActions(actions);
                                });

                                return originCollectionIdToCollectionMap;
                            });
                    Mono<List<CustomJSLib>> jsLibListMono =
                            jsLibModuleInstantiatingService.generateInstantiatedEntities(moduleInstantiatingMetaDTO);
                    Mono<ModuleInstanceDTO> moduleInstanceDTOMono =
                            generateModuleInstanceByViewMode(moduleInstance, ResourceModes.EDIT);

                    return Mono.zip(
                                    moduleInstanceListMono,
                                    actionListMono,
                                    collectionListMono,
                                    jsLibListMono,
                                    moduleInstanceDTOMono)
                            .map(tuple5 -> {
                                ModuleInstanceDTO createdModuleInstance = tuple5.getT5();

                                SimulatedModuleInstanceDTO simulatedModuleInstanceDTO =
                                        new SimulatedModuleInstanceDTO();
                                simulatedModuleInstanceDTO.setCreatedModuleInstance(createdModuleInstance);
                                simulatedModuleInstanceDTO.setOriginToNewActionMap(tuple5.getT2());
                                simulatedModuleInstanceDTO.setOriginToCollectionMap(tuple5.getT3());
                                simulatedModuleInstanceDTO.setOriginCollectionIdToActionsMap(
                                        moduleInstantiatingMetaDTO.getOriginCollectionIdToNewActionsMap());
                                // TODO: Add module instances and js libs to moduleInstanceEntitiesDTO

                                return simulatedModuleInstanceDTO;
                            });
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<ModuleInstance> generateModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO,
            String branchName,
            Mono<Module> sourceModuleMono,
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            Mono<NewPage> cachedPageMono) {
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

        Mono<Package> packageMono = sourceModuleMono
                .map(Module::getPackageId)
                .flatMap(packageRepository::findById)
                .flatMap(aPackage -> {
                    if (!Boolean.TRUE.equals(aPackage.getLatest())) {
                        return Mono.error(new AppsmithException(AppsmithError.STALE_MODULE_REFERENCE));
                    }

                    String packageId = aPackage.getId();
                    moduleInstantiatingMetaDTO.setSourcePackageId(packageId);
                    return Mono.just(aPackage);
                })
                .cache();

        return packageMono
                .then(updateEntityNamesMapMono)
                .then(sourceModuleMono)
                .zipWith(packageMono)
                .flatMap(tuple2 -> {
                    Module sourceModule = tuple2.getT1();
                    Package sourcePackage = tuple2.getT2();

                    ModuleInstance moduleInstance = new ModuleInstance();
                    moduleInstance.setType(sourceModule.getType());
                    moduleInstance.setSourceModuleId(sourceModule.getId());
                    moduleInstance.setModuleUUID(sourceModule.getModuleUUID());
                    moduleInstance.setOriginModuleId(sourceModule.getOriginModuleId());
                    moduleInstance.setDefaultResources(moduleInstanceReqDTO.getDefaultResources());
                    moduleInstance.setWorkspaceId(sourcePackage.getWorkspaceId());

                    ModuleInstanceDTO unpublishedModuleInstanceDTO = prepareUnpublishedModuleInstanceFromRequest(
                            moduleInstanceReqDTO, sourceModule.getPublishedModule());

                    moduleInstance.setUnpublishedModuleInstance(unpublishedModuleInstanceDTO);
                    moduleInstance.setPublishedModuleInstance(new ModuleInstanceDTO());

                    if (moduleInstanceReqDTO.getId() != null) {
                        // For simulated module instance flow the id should be retained from the existing module
                        // instance
                        moduleInstance.setId(moduleInstanceReqDTO.getId());
                    } else {
                        moduleInstance.setId(new ObjectId().toString());
                    }
                    unpublishedModuleInstanceDTO.setVersion(sourceModule.getVersion());

                    return generateBareBonesModuleInstanceAndReturnPage(
                                    moduleInstantiatingMetaDTO,
                                    moduleInstanceReqDTO,
                                    branchName,
                                    moduleInstance,
                                    cachedPageMono)
                            .map(page -> {
                                moduleInstantiatingMetaDTO.setOldToNewModuleEntityRefactorDTOsMap(
                                        sourceToInstantiatedEntityRefactorDTOsMap);

                                moduleInstantiatingMetaDTO.setRootModuleInstanceId(moduleInstance.getId());
                                moduleInstantiatingMetaDTO.setRootModuleInstanceName(moduleInstanceReqDTO.getName());
                                moduleInstantiatingMetaDTO.setContextType(moduleInstanceReqDTO.getContextType());
                                moduleInstantiatingMetaDTO.setContextId(moduleInstanceReqDTO.getContextId());
                                moduleInstantiatingMetaDTO.setSourceModuleId(sourceModule.getId());
                                moduleInstantiatingMetaDTO.setPage(page);

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

                                return moduleInstance;
                            });
                });
    }

    private Mono<ModuleInstance> saveModuleInstance(ModuleInstance moduleInstance) {
        return repository.save(moduleInstance).flatMap(repository::setUserPermissionsInObject);
    }

    private Mono<NewPage> generateBareBonesModuleInstanceAndReturnPage(
            ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO,
            ModuleInstanceDTO moduleInstanceReqDTO,
            String branchName,
            ModuleInstance moduleInstance,
            Mono<NewPage> cachedPageMono) {
        return cachedPageMono
                .flatMap(page -> {
                    if (Boolean.TRUE.equals(moduleInstantiatingMetaDTO.isSimulation())) {
                        return Mono.just(page);
                    }
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
                .map(page -> {
                    moduleInstance.setApplicationId(page.getApplicationId());
                    moduleInstance.getUnpublishedModuleInstance().setPageId(page.getId());

                    if (page.getDefaultResources() != null) {
                        DefaultResources defaultResources = moduleInstance.getDefaultResources();

                        if (defaultResources == null) {
                            defaultResources = new DefaultResources();
                        }

                        defaultResources.setApplicationId(
                                page.getDefaultResources().getApplicationId());
                        defaultResources.setPageId(page.getDefaultResources().getPageId());
                        moduleInstance.setDefaultResources(defaultResources);
                        moduleInstance.getUnpublishedModuleInstance().setDefaultResources(defaultResources);
                    }

                    this.setContextId(
                            moduleInstance.getUnpublishedModuleInstance(), page.getId(), CreatorContextType.PAGE);

                    defaultResourcesService.initialize(moduleInstance, branchName, false);
                    dtoDefaultResourcesService.initialize(
                            moduleInstance.getUnpublishedModuleInstance(), branchName, false);

                    if (moduleInstanceReqDTO.getGitSyncId() == null) {
                        moduleInstance.setGitSyncId(page.getApplicationId() + "_" + new ObjectId());
                    } else {
                        moduleInstance.setGitSyncId(moduleInstanceReqDTO.getGitSyncId());
                    }

                    generateAndSetModuleInstancePolicies(page, moduleInstance);

                    extractAndSetJsonPathKeys(moduleInstance);

                    return page;
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<CreateModuleInstanceResponseDTO> createOrphanModuleInstance(
            ModuleInstanceDTO moduleInstanceReqDTO, String branchName) {

        validateModuleInstanceDTO(moduleInstanceReqDTO, true);

        ModuleInstanceDTO unpublishedModuleInstanceDTO =
                prepareUnpublishedModuleInstanceFromRequest(moduleInstanceReqDTO, null);

        ModuleInstance moduleInstance = new ModuleInstance();

        moduleInstance.setType(moduleInstanceReqDTO.getType());
        moduleInstance.setModuleUUID(moduleInstanceReqDTO.getModuleUUID());
        moduleInstance.setDefaultResources(moduleInstanceReqDTO.getDefaultResources());
        moduleInstance.setWorkspaceId(moduleInstanceReqDTO.getWorkspaceId());

        moduleInstance.setUnpublishedModuleInstance(unpublishedModuleInstanceDTO);
        moduleInstance.setPublishedModuleInstance(new ModuleInstanceDTO());

        Mono<NewPage> cachedNewPageMono =
                getNewPageMono(moduleInstanceReqDTO, branchName).cache();

        final ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO = new ModuleInstantiatingMetaDTO();
        moduleInstantiatingMetaDTO.setBranchName(branchName);

        return generateBareBonesModuleInstanceAndReturnPage(
                        moduleInstantiatingMetaDTO, moduleInstanceReqDTO, branchName, moduleInstance, cachedNewPageMono)
                .flatMap(page -> saveModuleInstance(moduleInstance))
                .flatMap(savedModuleInstance ->
                        generateModuleInstanceByViewMode(savedModuleInstance, ResourceModes.EDIT))
                .flatMap(moduleInstanceDTO -> {
                    final CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                            new CreateModuleInstanceResponseDTO();
                    createModuleInstanceResponseDTO.setModuleInstance(moduleInstanceDTO);
                    createModuleInstanceResponseDTO.setEntities(new ModuleInstanceEntitiesDTO());

                    return Mono.just(createModuleInstanceResponseDTO);
                });
    }

    @Override
    public void generateAndSetModuleInstancePolicies(NewPage page, ModuleInstance moduleInstance) {
        Set<Policy> policies =
                policyGenerator.getAllChildPolicies(page.getPolicies(), NewPage.class, ModuleInstance.class);

        moduleInstance.setPolicies(policies);
    }

    private void setContextId(ModuleInstanceDTO moduleInstance, String contextId, CreatorContextType contextType) {
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

        moduleInstanceDTO.setContextType(moduleInstanceReqDTO.getContextType());

        if (moduleInstanceReqDTO.getInputs() == null && sourceModuleDTO != null) {
            Map<String, String> inputs = transformModuleInputsToModuleInstance(sourceModuleDTO);
            moduleInstanceDTO.setInputs(inputs);
        } else {
            moduleInstanceDTO.setInputs(moduleInstanceReqDTO.getInputs());
        }

        moduleInstanceDTO.setIsValid(moduleInstanceReqDTO.getIsValid() == null || moduleInstanceReqDTO.getIsValid());
        moduleInstanceDTO.setInvalids(moduleInstanceReqDTO.getInvalids());

        moduleInstanceDTO.setDefaultResources(moduleInstanceReqDTO.getDefaultResources());

        return moduleInstanceDTO;
    }

    private Mono<NewPage> getNewPageMono(ModuleInstanceDTO moduleInstanceDTO, String branchName) {
        String pageId = moduleInstanceDTO.getContextId();
        if (moduleInstanceDTO.getDefaultResources() != null
                && StringUtils.hasText(moduleInstanceDTO.getDefaultResources().getPageId())) {
            pageId = moduleInstanceDTO.getDefaultResources().getPageId();
        }
        return newPageService
                .findByBranchNameAndDefaultPageId(branchName, pageId, pagePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE_ID, pageId)));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String defaultModuleInstanceId, String branchName) {
        Mono<ModuleInstance> branchedModuleInstanceMono = repository
                .findByBranchNameAndDefaultModuleInstanceId(
                        branchName, defaultModuleInstanceId, moduleInstancePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE_ID, defaultModuleInstanceId)));

        return branchedModuleInstanceMono.flatMap(
                branchedModuleInstance -> deleteBranchedModuleInstance(branchedModuleInstance)
                        .as(transactionalOperator::transactional)
                        .flatMap(deletedModuleInstance -> {
                            if (CreatorContextType.PAGE.equals(deletedModuleInstance.getContextType())) {
                                return updateLayoutService
                                        .updatePageLayoutsByPageId(deletedModuleInstance.getContextId())
                                        .thenReturn(deletedModuleInstance);
                            }
                            return Mono.just(deletedModuleInstance);
                        }));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceDTO> deleteUnpublishedModuleInstance(String moduleInstanceId) {
        Mono<ModuleInstance> moduleInstanceMono = repository
                .findById(moduleInstanceId, moduleInstancePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE_ID, moduleInstanceId)));

        return moduleInstanceMono.flatMap(moduleInstance -> deleteBranchedModuleInstance(moduleInstance));
    }

    private Mono<ModuleInstanceDTO> deleteBranchedModuleInstance(ModuleInstance moduleInstance) {
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
                            .flatMap(deletedModuleInstance -> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
                                    deletedModuleInstance, deletedModuleInstance.getUnpublishedModuleInstance())));
        }

        // This module instance was never published. It can be safely archived along with its composed
        // entities.
        return newActionService
                .archiveActionsByRootModuleInstanceId(moduleInstance.getId())
                .then(actionCollectionService.archiveActionCollectionsByRootModuleInstanceId(moduleInstance.getId()))
                .then(this.archiveModuleInstancesByRootModuleInstanceId(moduleInstance.getId()))
                // TODO: Delete all the related custom JS libs here
                .then(repository
                        .archive(moduleInstance)
                        .flatMap(deletedModuleInstance -> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
                                deletedModuleInstance, deletedModuleInstance.getUnpublishedModuleInstance())));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceEntitiesDTO> getAllEntities(
            String contextId, CreatorContextType contextType, String branchName, boolean viewMode) {

        Mono<NewPage> pageMono = newPageService
                .findByBranchNameAndDefaultPageId(branchName, contextId, pagePermission.getReadPermission())
                .cache();

        AclPermission permission =
                viewMode ? actionPermission.getExecutePermission() : actionPermission.getReadPermission();

        Mono<List<ActionViewDTO>> actionDTOListMono = pageMono.flatMapMany(
                        newPage -> newActionService.getAllModuleInstanceActionInContext(
                                newPage.getId(), contextType, permission, viewMode, false))
                .collectList();

        Mono<List<ActionCollectionDTO>> collectionDTOListMono = pageMono.flatMapMany(
                        newPage -> actionCollectionService.getAllModuleInstanceCollectionsInContext(
                                newPage.getId(), contextType, permission, viewMode))
                .collectList();

        return getModuleInstanceEntitiesDTOMono(actionDTOListMono, collectionDTOListMono, viewMode);
    }

    private Mono<ModuleInstanceEntitiesDTO> getModuleInstanceEntitiesDTOMono(
            Mono<List<ActionViewDTO>> actionsMono,
            Mono<List<ActionCollectionDTO>> actionCollectionsMono,
            boolean viewMode) {
        final ModuleInstanceEntitiesDTO moduleInstanceEntitiesDTO = new ModuleInstanceEntitiesDTO();

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
            final Map<String, List<ActionDTO>> collectionIdToActionsMap = new HashMap<>();

            return newActionService
                    .findAllJSActionsByCollectionIdsAndViewMode(collectionIds, null, viewMode)
                    .map(actionDTO -> {
                        List<ActionDTO> childActionDTOs =
                                collectionIdToActionsMap.getOrDefault(actionDTO.getCollectionId(), new ArrayList<>());
                        childActionDTOs.add(actionDTO);
                        collectionIdToActionsMap.put(actionDTO.getCollectionId(), childActionDTOs);
                        return actionDTO;
                    })
                    .collectList()
                    .then(Flux.fromIterable(collectionIdToActionCollectionMap.values())
                            .map(actionCollectionDTO -> {
                                List<ActionDTO> jsActions = collectionIdToActionsMap.get(actionCollectionDTO.getId());
                                actionCollectionDTO.setActions(jsActions);
                                return actionCollectionDTO;
                            })
                            .collectList())
                    .flatMap(actionCollectionDTOs -> {
                        moduleInstanceEntitiesDTO.setJsCollections(actionCollectionDTOs);
                        return Mono.just(moduleInstanceEntitiesDTO);
                    });
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<List<ModuleInstance>> archiveModuleInstancesByRootModuleInstanceId(String rootModuleInstanceId) {
        return repository
                .findAllByRootModuleInstanceId(
                        rootModuleInstanceId, null, Optional.of(moduleInstancePermission.getDeletePermission()))
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Flux<ModuleInstance> findByPageIds(
            List<String> unpublishedPages, Optional<AclPermission> optionalPermission) {
        return repository.findByPageIds(unpublishedPages, optionalPermission);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Flux<ModuleInstance> findAllUnpublishedByOriginModuleIdOrModuleUUID(
            Module sourceModule, Optional<AclPermission> permission) {
        return repository.findAllUnpublishedByOriginModuleIdOrModuleUUID(sourceModule, permission);
    }

    @Override
    public Mono<Boolean> archiveModuleInstancesByApplicationId(String applicationId, AclPermission permission) {
        return repository
                .findAllByApplicationId(applicationId, Optional.of(permission))
                .map(ModuleInstance::getId)
                .collectList()
                .flatMap(moduleInstanceIds -> {
                    if (CollectionUtils.isEmpty(moduleInstanceIds)) {
                        return Mono.just(Boolean.TRUE);
                    }
                    return repository.archiveAllById(moduleInstanceIds);
                });
    }

    @Override
    public Mono<List<ModuleInstanceDTO>> deleteByContextId(String contextId, CreatorContextType contextType) {
        return repository
                .findAllUnpublishedByContextIdAndContextType(
                        contextId, contextType, moduleInstancePermission.getDeletePermission())
                .flatMap(moduleInstance -> deleteBranchedModuleInstance(moduleInstance))
                .collectList()
                .as(transactionalOperator::transactional);
    }
}
