package com.appsmith.server.modules.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleUtils;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ModuleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
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
    private final ModuleRepository moduleRepository;
    private final ModulePermission modulePermission;
    private final PolicyGenerator policyGenerator;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final PackagePermissionChecker packagePermissionChecker;
    private final PackagePermission packagePermission;
    private final ModuleInstancePermissionChecker moduleInstancePermissionChecker;
    private final TransactionalOperator transactionalOperator;
    private static ObjectMapper objectMapper = new ObjectMapper();
    private final PluginService pluginService;

    public CrudModuleServiceImpl(
            ModuleRepository moduleRepository,
            ModulePermission modulePermission,
            PolicyGenerator policyGenerator,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            PackagePermissionChecker packagePermissionChecker,
            PackagePermission packagePermission,
            ModuleInstancePermissionChecker moduleInstancePermissionChecker,
            TransactionalOperator transactionalOperator,
            PluginService pluginService) {
        super(moduleRepository);
        this.moduleRepository = moduleRepository;
        this.modulePermission = modulePermission;
        this.policyGenerator = policyGenerator;
        this.newActionService = newActionService;
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
        Mono<NewAction> publicActionMono = newActionService.findPublicActionByModuleId(moduleDTO.getId());
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
        return moduleRepository.getAllModulesByPackageId(packageId, modulePermission.getReadPermission());
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
    public Mono<ModuleDTO> getModule(String moduleId) {

        return moduleRepository
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

        if (!newActionService.validateActionName(moduleDTO.getName())) {
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
        return moduleRepository.save(module).flatMap(savedModule -> moduleRepository
                .findById(savedModule.getId(), modulePermission.getCreateExecutablesPermission())
                .flatMap(fetchedModule -> {
                    ModuleDTO moduleDTO = module.getUnpublishedModule();
                    moduleDTO.setId(fetchedModule.getId());
                    moduleDTO.setUserPermissions(fetchedModule.getUserPermissions());

                    NewAction moduleAction = createModuleAction(moduleDTO, workspaceId, true);
                    Set<Policy> childActionPolicies = policyGenerator.getAllChildPolicies(
                            fetchedModule.getPolicies(), Module.class, Action.class);
                    moduleAction.setPolicies(childActionPolicies);

                    return newActionService
                            .validateAndSaveActionToRepository(moduleAction)
                            .flatMap(savedActionDTO -> moduleRepository
                                    .save(fetchedModule)
                                    .flatMap(moduleRepository::setUserPermissionsInObject)
                                    .then(setTransientFieldsFromModuleToModuleDTO(
                                            fetchedModule, fetchedModule.getUnpublishedModule())));
                }));
    }

    private NewAction createModuleAction(ModuleDTO moduleDTO, String workspaceId, boolean isPublic) {
        NewAction moduleAction = new NewAction();
        if (moduleDTO.getEntity() == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ENTITY);
        }
        moduleAction.setWorkspaceId(workspaceId);

        ModuleActionDTO unpublishedAction = (ModuleActionDTO) moduleDTO.getEntity();

        unpublishedAction.setIsPublic(isPublic);
        unpublishedAction.setName(moduleDTO.getName());
        unpublishedAction.setModuleId(moduleDTO.getId());
        unpublishedAction.setDefaultResources(new DefaultResources());
        unpublishedAction.setContextType(CreatorContextType.MODULE);

        moduleAction.setUnpublishedAction(unpublishedAction);
        moduleAction.setPublishedAction(new ActionDTO());
        moduleAction.setDefaultResources(new DefaultResources());

        return moduleAction;
    }

    private Mono<Boolean> isValidName(String name, String packageId, String currentModuleId) {

        Mono<List<String>> allModuleNamesMono = moduleRepository
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

        if (!newActionService.validateActionName(moduleDTO.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION_NAME));
        }

        return moduleRepository
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
                                    .findPublicActionByModuleId(moduleId)
                                    .flatMap(newAction -> {
                                        ActionDTO updateActionDTO = new ActionDTO();
                                        updateActionDTO.setContextType(CreatorContextType.MODULE);
                                        updateActionDTO.setName(moduleDTO.getName());
                                        updateActionDTO.setDatasource(
                                                newAction.getUnpublishedAction().getDatasource());
                                        return newActionService.updateUnpublishedActionWithoutAnalytics(
                                                newAction.getId(), updateActionDTO, Optional.empty());
                                    })
                                    .then(moduleRepository
                                            .updateAndReturn(
                                                    moduleId,
                                                    updateObj,
                                                    Optional.of(modulePermission.getEditPermission()))
                                            .flatMap(moduleRepository::setUserPermissionsInObject)
                                            .flatMap(updatedModule -> {
                                                ModuleDTO unpublishedModule = updatedModule.getUnpublishedModule();
                                                return setTransientFieldsFromModuleToModuleDTO(
                                                        updatedModule, unpublishedModule);
                                            }));
                        }));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleDTO> deleteModule(String moduleId) {
        Mono<Module> moduleMono = moduleRepository
                .findById(moduleId, modulePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));

        Mono<Long> moduleInstanceCountMono = moduleInstancePermissionChecker.getModuleInstanceCountByModuleId(moduleId);

        return moduleMono
                .zipWith(moduleInstanceCountMono)
                .flatMap(tuple2 -> {
                    Module module = tuple2.getT1();
                    Long numberOfModuleInstances = tuple2.getT2();

                    if (numberOfModuleInstances > 0) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.MODULE_HAS_INSTANCES, numberOfModuleInstances));
                    }

                    return moduleRepository.archive(module).flatMap(deletedModule -> {
                        return newActionService
                                .archiveActionsByModuleId(moduleId)
                                .then(actionCollectionService.archiveActionCollectionsByModuleId(moduleId))
                                .then(setTransientFieldsFromModuleToModuleDTO(
                                        deletedModule, deletedModule.getUnpublishedModule()));
                    });
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Flux<Module> saveModuleInBulk(List<Module> modules) {
        return moduleRepository.saveAll(modules);
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
        return moduleRepository
                .getAllModulesByPackageId(packageId, modulePermission.getDeletePermission())
                .flatMap(toBeDeletedModule -> deleteModule(toBeDeletedModule.getId()))
                .collectList()
                .then();
    }

    @Override
    public Mono<List<ModuleDTO>> getAllConsumableModules(List<String> packageIds) {
        return moduleRepository
                .getAllConsumableModulesByPackageIds(packageIds, modulePermission.getReadPermission())
                .flatMap(module -> setTransientFieldsFromModuleToModuleDTO(module, module.getPublishedModule()))
                .collectList();
    }
}
