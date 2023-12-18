package com.appsmith.server.modules.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.dtos.ModuleActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermissionChecker;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.packages.permissions.PackagePermissionChecker;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.models.ModuleType.JS_MODULE;
import static com.appsmith.external.models.ModuleType.QUERY_MODULE;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
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
    private final ObjectMapper objectMapper;
    private final ModulePublicEntityService<NewAction> newActionModulePublicEntityService;
    private final ModulePublicEntityService<ActionCollection> actionCollectionModulePublicEntityService;

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
            ObjectMapper objectMapper,
            ModulePublicEntityService<NewAction> newActionModulePublicEntityService,
            ModulePublicEntityService<ActionCollection> actionCollectionModulePublicEntityService) {
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
        this.objectMapper = objectMapper;
        this.newActionModulePublicEntityService = newActionModulePublicEntityService;
        this.actionCollectionModulePublicEntityService = actionCollectionModulePublicEntityService;
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

        ModulePublicEntityService<?> modulePublicEntityService = getModulePublicEntityService(moduleDTO);

        return Mono.zip(
                        getSettingsFormForModuleInstance(),
                        modulePublicEntityService.getPublicEntitySettingsForm(moduleDTO.getId()))
                .flatMap(tuple2 -> {
                    Object moduleInstanceSettings = tuple2.getT1();
                    Object pluginSettings = tuple2.getT2();

                    JsonNode pluginSettingsNode = objectMapper.valueToTree(pluginSettings);
                    JsonNode moduleInstanceSettingsNode = objectMapper.valueToTree(moduleInstanceSettings);

                    ModuleUtils.getSettingsForModuleCreator(pluginSettingsNode, moduleInstanceSettingsNode);

                    moduleDTO.setSettingsForm(pluginSettingsNode);

                    return Mono.just(moduleDTO);
                });
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
                .flatMap(tuple2 -> this.saveModuleAndCreatePublicEntity(tuple2.getT1(), tuple2.getT2()))
                .as(transactionalOperator::transactional);
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
        List<JsonNode> settingsForm;
        ClassPathResource resource = new ClassPathResource("modules/setting.json");

        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode rootTree = objectMapper.readTree(inputStream);
            settingsForm = objectMapper.convertValue(rootTree.get("setting"), List.class);
        } catch (IOException e) {
            return Mono.error(
                    new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, "Unable to fetch settings of module"));
        }

        return Mono.just(settingsForm);
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

    private Mono<ModuleDTO> saveModuleAndCreatePublicEntity(Module module, String workspaceId) {

        return repository
                .save(module)
                .flatMap(repository::setUserPermissionsInObject)
                .flatMap(savedModule -> {
                    ModuleConsumable publicEntity =
                            savedModule.getUnpublishedModule().getEntity();

                    // Since this entity is being created by default,
                    // we can set the name to be same as the module name
                    publicEntity.setName(savedModule.getUnpublishedModule().getName());

                    ModulePublicEntityService<?> modulePublicEntityService =
                            getModulePublicEntityService(savedModule.getUnpublishedModule());

                    return modulePublicEntityService
                            .createPublicEntity(workspaceId, module, publicEntity)
                            .then(this.setTransientFieldsFromModuleToModuleDTO(
                                    savedModule, savedModule.getUnpublishedModule()))
                            .flatMap(this::setModuleSettingsForCreator);
                });
    }

    private ModulePublicEntityService<?> getModulePublicEntityService(ModuleDTO moduleDTO) {
        if (QUERY_MODULE.equals(moduleDTO.getType()) || moduleDTO.getEntity() instanceof ModuleActionDTO) {
            return newActionModulePublicEntityService;
        } else if (JS_MODULE.equals(moduleDTO.getType())
                || moduleDTO.getEntity() instanceof ModuleActionCollectionDTO) {
            return actionCollectionModulePublicEntityService;
        }
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    private Mono<Boolean> isValidName(String name, String packageId, String currentModuleId) {

        Mono<List<String>> allModuleNamesMono = repository
                .getAllModulesByPackageId(packageId, modulePermission.getReadPermission())
                .filter(module -> {
                    // Check if currentModuleId is null or if module.getId() does not match currentModuleId
                    return !module.getId().equals(currentModuleId);
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Flux<Module> findUniqueReferencesByIds(Set<String> ids, Optional<AclPermission> permission) {
        List<String> projectionFields =
                List.of(completeFieldName(QModule.module.packageUUID), completeFieldName(QModule.module.moduleUUID));
        return repository.findAllByIds(ids, projectionFields, permission);
    }
}
