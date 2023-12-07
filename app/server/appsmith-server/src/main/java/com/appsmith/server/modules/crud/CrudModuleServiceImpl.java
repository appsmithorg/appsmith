package com.appsmith.server.modules.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.validations.EntityValidationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
@Slf4j
public class CrudModuleServiceImpl extends CrudModuleServiceCECompatibleImpl implements CrudModuleService {
    private final ModuleRepository repository;
    private final ModulePermission modulePermission;
    private final PolicyGenerator policyGenerator;
    private final NewActionService newActionService;
    private final EntityValidationService entityValidationService;
    private final ActionCollectionService actionCollectionService;
    private final PackagePermissionChecker packagePermissionChecker;
    private final PackagePermission packagePermission;
    private final ModuleInstancePermissionChecker moduleInstancePermissionChecker;
    private final TransactionalOperator transactionalOperator;
    private static ObjectMapper objectMapper = new ObjectMapper();
    private final PluginService pluginService;

    public CrudModuleServiceImpl(
            ModuleRepository repository,
            ModulePermission modulePermission,
            PolicyGenerator policyGenerator,
            NewActionService newActionService,
            EntityValidationService entityValidationService,
            ActionCollectionService actionCollectionService,
            PackagePermissionChecker packagePermissionChecker,
            PackagePermission packagePermission,
            ModuleInstancePermissionChecker moduleInstancePermissionChecker,
            TransactionalOperator transactionalOperator,
            PluginService pluginService) {
        super(repository);
        this.repository = repository;
        this.modulePermission = modulePermission;
        this.policyGenerator = policyGenerator;
        this.newActionService = newActionService;
        this.entityValidationService = entityValidationService;
        this.actionCollectionService = actionCollectionService;
        this.packagePermissionChecker = packagePermissionChecker;
        this.packagePermission = packagePermission;
        this.moduleInstancePermissionChecker = moduleInstancePermissionChecker;
        this.transactionalOperator = transactionalOperator;
        this.pluginService = pluginService;
    }

    @Override
    public Mono<List<ModuleDTO>> getAllModuleDTOs(String packageId, ResourceModes resourceMode) {
        return getAllModules(packageId)
                .flatMap(module -> {
                    ModuleDTO moduleDTO;
                    if (resourceMode.equals(ResourceModes.EDIT)) {
                        moduleDTO = module.getUnpublishedModule();
                    } else {
                        moduleDTO = module.getPublishedModule();
                    }
                    return setTransientFieldsFromModuleToModuleDTO(module, moduleDTO)
                            .flatMap(this::setModuleSettingsForCreator);
                })
                .collectList();
    }

    private Mono<ModuleDTO> setModuleSettingsForCreator(ModuleDTO moduleDTO) {
        Mono<NewAction> publicActionMono =
                newActionService.findPublicActionByModuleId(moduleDTO.getId(), ResourceModes.EDIT);
        return getSettingsFormForModuleInstance().zipWith(publicActionMono).flatMap(tuple2 -> pluginService
                .getFormConfig(tuple2.getT2().getPluginId())
                .flatMap(pluginConfigMap -> {
                    Object pluginSettings = pluginConfigMap.get("setting");
                    Object moduleInstanceSettings = tuple2.getT1();

                    JsonNode pluginSettingsNode = objectMapper.valueToTree(pluginSettings);
                    JsonNode moduleInstanceSettingsNode = objectMapper.valueToTree(moduleInstanceSettings);

                    ModuleUtils.getSettingsForModuleCreator(pluginSettingsNode, moduleInstanceSettingsNode);

                    moduleDTO.setSettingsForm(pluginSettingsNode);

                    return Mono.just(moduleDTO);
                }));
    }

    private Mono<ModuleDTO> setTransientFieldsFromModuleToModuleDTO(Module module, ModuleDTO moduleDTO) {

        return getSettingsFormForModuleInstance().flatMap(settingsForm -> {
            moduleDTO.setModuleUUID(module.getModuleUUID());
            moduleDTO.setId(module.getId());
            moduleDTO.setType(module.getType());
            moduleDTO.setPackageId(module.getPackageId());
            moduleDTO.setPackageUUID(module.getPackageUUID());
            moduleDTO.setUserPermissions(module.getUserPermissions());
            moduleDTO.setEntity(null);

            moduleDTO.setSettingsForm(settingsForm);

            return Mono.just(moduleDTO);
        });
    }

    @Override
    public Flux<Module> getAllModules(String packageId) {
        return repository.getAllModulesByPackageId(packageId, modulePermission.getReadPermission());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleDTO> createModule(ModuleDTO moduleDTO) {
        return validateModule(moduleDTO)
                .flatMap(tuple2 -> this.saveModuleAndCreateAction(tuple2.getT1(), tuple2.getT2()))
                .as(transactionalOperator::transactional);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ActionDTO> createPrivateModuleAction(ActionDTO action, String branchName) {

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(action.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }

        return createModuleAction(action.getModuleId(), null, false, (ModuleActionDTO) action);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ActionCollectionDTO> createPrivateModuleActionCollection(
            ActionCollectionDTO actionCollectionDTO, String branchName) {

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(actionCollectionDTO.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }

        return createModuleActionCollection(
                actionCollectionDTO.getModuleId(), null, false, (ActionCollectionDTO) actionCollectionDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleDTO> getModule(String moduleId) {

        return repository
                .findById(moduleId, modulePermission.getReadPermission())
                .flatMap(module -> this.generateModuleByViewMode(module, ResourceModes.EDIT))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));
    }

    public Mono<ModuleDTO> generateModuleByViewMode(Module module, ResourceModes resourceMode) {
        ModuleDTO moduleDTO;
        if (module.getDeletedAt() != null) {
            return Mono.empty();
        }

        if (resourceMode.equals(ResourceModes.EDIT)) {
            moduleDTO = module.getUnpublishedModule();
        } else {
            moduleDTO = module.getPublishedModule();
        }

        return setTransientFieldsFromModuleToModuleDTO(module, moduleDTO);
    }

    private Mono<Object> getSettingsFormForModuleInstance() {
        try {
            ClassPathResource resource = new ClassPathResource("modules/setting.json");
            InputStream inputStream = resource.getInputStream();

            JsonNode rootTree = objectMapper.readTree(inputStream);

            List<JsonNode> settingsForm = objectMapper.convertValue(rootTree.get("setting"), List.class);

            inputStream.close();

            return Mono.just(settingsForm);
        } catch (IOException e) {
            return Mono.error(
                    new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, "Unable to fetch settings of module"));
        }
    }

    private Mono<Tuple2<Module, String>> validateModule(ModuleDTO moduleDTO) {
        if (ValidationUtils.isEmptyParam(moduleDTO.getPackageId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PACKAGE_ID));
        }

        if (ValidationUtils.isEmptyParam(moduleDTO.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (!entityValidationService.validateName(moduleDTO.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION_NAME));
        }

        Module module = new Module();
        module.setType(moduleDTO.getType());
        module.setPublishedModule(new ModuleDTO());
        module.setModuleUUID(new ObjectId().toString());

        return packagePermissionChecker
                .findById(moduleDTO.getPackageId(), packagePermission.getModuleCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, moduleDTO.getPackageId())))
                .flatMap(aPackage -> isValidName(moduleDTO.getName(), aPackage.getId(), null)
                        .flatMap(valid -> {
                            if (!valid) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.DUPLICATE_KEY_USER_ERROR, moduleDTO.getName(), FieldName.NAME));
                            }
                            module.setPackageId(aPackage.getId());
                            module.setPackageUUID(aPackage.getPackageUUID());

                            Set<Policy> modulePolicyMap = policyGenerator.getAllChildPolicies(
                                    aPackage.getPolicies(), Package.class, Module.class);
                            module.setPolicies(modulePolicyMap);

                            module.setUnpublishedModule(moduleDTO);

                            return Mono.just(module).zipWith(Mono.just(aPackage.getWorkspaceId()));
                        }));
    }

    private Mono<ModuleDTO> saveModuleAndCreateAction(Module module, String workspaceId) {

        return repository
                .save(module)
                .flatMap(repository::setUserPermissionsInObject)
                .flatMap(savedModule -> {
                    ModuleActionDTO moduleActionDTO =
                            (ModuleActionDTO) savedModule.getUnpublishedModule().getEntity();

                    // Since this action is being created by default, we can set the name of the action to be the same
                    // as the
                    // module name
                    moduleActionDTO.setName(savedModule.getUnpublishedModule().getName());

                    return createModuleAction(savedModule.getId(), workspaceId, true, moduleActionDTO)
                            .then(setTransientFieldsFromModuleToModuleDTO(
                                    savedModule, savedModule.getUnpublishedModule()))
                            .flatMap(this::setModuleSettingsForCreator);
                });
    }

    private Mono<ActionDTO> createModuleAction(
            String moduleId, String optionalWorkspaceId, boolean isPublic, ModuleActionDTO moduleActionDTO) {
        return checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, optionalWorkspaceId)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    NewAction moduleAction = generateActionDomain(moduleId, workspaceId, isPublic, moduleActionDTO);
                    Set<Policy> childActionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleAction.setPolicies(childActionPolicies);

                    return newActionService.validateAndSaveActionToRepository(moduleAction);
                });
    }

    private Mono<ActionCollectionDTO> createModuleActionCollection(
            String moduleId, String optionalWorkspaceId, boolean isPublic, ActionCollectionDTO actionCollectionDTO) {
        return checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, optionalWorkspaceId)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    ActionCollection moduleActionCollection =
                            generateActionCollectionDomain(moduleId, workspaceId, isPublic, actionCollectionDTO);
                    Set<Policy> childActionCollectionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleActionCollection.setPolicies(childActionCollectionPolicies);

                    return actionCollectionService.validateAndSaveCollection(moduleActionCollection);
                });
    }

    private Mono<Tuple2<Module, String>> checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
            String moduleId, String optionalWorkspaceId) {
        return repository
                .findById(moduleId, modulePermission.getCreateExecutablesPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)))
                .flatMap(module -> {
                    if (StringUtils.hasLength(optionalWorkspaceId)) {
                        return Mono.zip(Mono.just(module), Mono.just(optionalWorkspaceId));
                    }

                    // Using the least level permission to fetch the package (to auto fill workspaceid). It is assumed
                    // that the developer has access to the package since she is editing a module in it by adding an
                    // action.
                    return packagePermissionChecker
                            .findById(module.getPackageId(), packagePermission.getReadPermission())
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, module.getPackageId())))
                            .flatMap(aPackage -> {
                                if (!StringUtils.hasLength(aPackage.getWorkspaceId())) {
                                    // This should never happen. If it does, it means that the package is not associated
                                    // with
                                    // any workspace. This is a bad state and should be reported.
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.zip(Mono.just(module), Mono.just(aPackage.getWorkspaceId()));
                            });
                });
    }

    private NewAction generateActionDomain(
            String moduleId, String workspaceId, boolean isPublic, ModuleActionDTO moduleActionDTO) {
        NewAction moduleAction = new NewAction();
        moduleAction.setWorkspaceId(workspaceId);

        moduleAction.setIsPublic(isPublic);
        moduleActionDTO.setModuleId(moduleId);
        moduleActionDTO.setDefaultResources(new DefaultResources());
        moduleActionDTO.setContextType(CreatorContextType.MODULE);

        moduleAction.setUnpublishedAction(moduleActionDTO);
        moduleAction.setPublishedAction(new ActionDTO());
        moduleAction.setDefaultResources(new DefaultResources());

        return moduleAction;
    }

    private ActionCollection generateActionCollectionDomain(
            String moduleId, String workspaceId, boolean isPublic, ActionCollectionDTO actionCollectionDTO) {
        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setWorkspaceId(workspaceId);
        actionCollection.setModuleId(moduleId);
        actionCollection.setIsPublic(isPublic);

        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setIsPublic(isPublic);
        actionCollectionDTO.setModuleId(moduleId);
        actionCollectionDTO.setDefaultResources(new DefaultResources());
        actionCollectionDTO.setContextType(CreatorContextType.MODULE);

        // Ensure that all actions in the collection have the same contextType and moduleId as the collection itself
        actionCollectionDTO.getActions().stream().forEach(action -> {
            action.setIsPublic(isPublic);
            action.setModuleId(moduleId);
            action.setContextType(CreatorContextType.MODULE);
        });

        actionCollection.setUnpublishedCollection(actionCollectionDTO);
        actionCollection.setPublishedCollection(new ActionCollectionDTO());
        actionCollection.setDefaultResources(new DefaultResources());

        return actionCollection;
    }

    private Mono<Boolean> isValidName(String name, String packageId, String currentModuleId) {

        Mono<List<String>> allModuleNamesMono = repository
                .getAllModulesByPackageId(packageId, modulePermission.getReadPermission())
                .filter(module -> {
                    // Check if currentModuleId is null or if module.getId() does not match currentModuleId
                    return currentModuleId == null || !module.getId().equals(currentModuleId);
                })
                .map(module -> module.getUnpublishedModule().getName())
                .collectList();

        return allModuleNamesMono.flatMap(allModuleNames -> {
            if (allModuleNames.contains(name)) {
                return Mono.just(Boolean.FALSE);
            }
            return Mono.just(Boolean.TRUE);
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleDTO> updateModule(ModuleDTO moduleDTO, String moduleId) {
        if (ValidationUtils.isEmptyParam(moduleDTO.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (!entityValidationService.validateName(moduleDTO.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION_NAME));
        }

        return repository
                .findById(moduleId, modulePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)))
                .cache()
                .flatMap(module -> isValidName(moduleDTO.getName(), module.getPackageId(), moduleId)
                        .flatMap(valid -> {
                            if (!valid) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.DUPLICATE_KEY_USER_ERROR, moduleDTO.getName(), FieldName.NAME));
                            }

                            Update updateObj = prepareUpdatableFieldsForModule(moduleDTO);

                            if (updateObj.getUpdateObject().isEmpty()) {
                                return setTransientFieldsFromModuleToModuleDTO(module, module.getUnpublishedModule());
                            }

                            return newActionService
                                    .findPublicActionByModuleId(moduleId, ResourceModes.EDIT)
                                    .flatMap(newAction -> {
                                        ActionDTO updateActionDTO = new ActionDTO();
                                        updateActionDTO.setContextType(CreatorContextType.MODULE);
                                        updateActionDTO.setName(moduleDTO.getName());
                                        updateActionDTO.setDatasource(
                                                newAction.getUnpublishedAction().getDatasource());
                                        return newActionService.updateUnpublishedActionWithoutAnalytics(
                                                newAction.getId(), updateActionDTO, Optional.empty());
                                    })
                                    .then(repository
                                            .updateAndReturn(
                                                    moduleId,
                                                    updateObj,
                                                    Optional.of(modulePermission.getEditPermission()))
                                            .flatMap(repository::setUserPermissionsInObject)
                                            .flatMap(updatedModule -> {
                                                ModuleDTO unpublishedModule = updatedModule.getUnpublishedModule();
                                                return setTransientFieldsFromModuleToModuleDTO(
                                                                updatedModule, unpublishedModule)
                                                        .flatMap(this::setModuleSettingsForCreator);
                                            }));
                        }));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleDTO> deleteModule(String moduleId) {
        Mono<Module> moduleMono = repository
                .findById(moduleId, modulePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));

        return moduleMono
                .flatMap(module -> moduleInstancePermissionChecker
                        .getModuleInstanceCountByModuleUUID(module.getModuleUUID())
                        .flatMap(numberOfModuleInstances -> {
                            if (numberOfModuleInstances > 0) {
                                return Mono.error(new AppsmithException(
                                        AppsmithError.MODULE_HAS_INSTANCES, numberOfModuleInstances));
                            }

                            return repository.archive(module).flatMap(deletedModule -> newActionService
                                    .archiveActionsByModuleId(moduleId)
                                    .then(actionCollectionService.archiveActionCollectionsByModuleId(moduleId))
                                    .then(setTransientFieldsFromModuleToModuleDTO(
                                            deletedModule, deletedModule.getUnpublishedModule())));
                        }))
                .as(transactionalOperator::transactional);
    }

    @Override
    public Flux<Module> saveModuleInBulk(List<Module> modules) {
        return repository.saveAll(modules);
    }

    private Update prepareUpdatableFieldsForModule(ModuleDTO moduleDTO) {
        Update updateObj = new Update();
        String namePath =
                fieldName(QModule.module.unpublishedModule) + "." + fieldName(QModule.module.unpublishedModule.name);
        String inputsPath = fieldName(QModule.module.unpublishedModule) + "."
                + fieldName(QModule.module.unpublishedModule.inputsForm);

        ObjectUtils.setIfNotEmpty(updateObj, namePath, moduleDTO.getName());
        ObjectUtils.setIfNotEmpty(updateObj, inputsPath, moduleDTO.getInputsForm());

        return updateObj;
    }

    @Override
    public Mono<Void> archiveModulesByPackageId(String packageId) {
        return repository
                .getAllModulesByPackageId(packageId, modulePermission.getDeletePermission())
                .flatMap(toBeDeletedModule -> deleteModule(toBeDeletedModule.getId()))
                .collectList()
                .then();
    }

    @Override
    public Mono<List<ModuleDTO>> getAllConsumableModules(List<String> packageIds) {
        return repository
                .getAllConsumableModulesByPackageIds(packageIds, modulePermission.getReadPermission())
                .flatMap(module -> setTransientFieldsFromModuleToModuleDTO(module, module.getPublishedModule()))
                .collectList();
    }

    @Override
    public Mono<ModuleDTO> findByIdAndLayoutsId(
            String creatorId, String layoutId, AclPermission permission, ResourceModes resourceModes) {
        return repository
                .findByIdAndLayoutsIdAndViewMode(creatorId, layoutId, permission, resourceModes)
                .flatMap(module -> generateModuleByViewMode(module, resourceModes));
    }
}
