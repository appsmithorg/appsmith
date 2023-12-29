package com.appsmith.server.packages.crud;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QPackage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleMetadata;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.WorkspacePermission;
import com.mongodb.client.result.UpdateResult;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_PACKAGES;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
public class CrudPackageServiceImpl extends CrudPackageServiceCECompatibleImpl implements CrudPackageService {

    private final PackageRepository repository;
    private final WorkspaceService workspaceService;
    private final WorkspacePermission workspacePermission;
    private final PolicyGenerator policyGenerator;
    private final PackagePermission packagePermission;
    private final CrudModuleService crudModuleService;
    private final SessionUserService sessionUserService;
    private final TransactionalOperator transactionalOperator;

    private final ModulePublicEntityService<NewAction> newActionModulePublicEntityService;
    private final ModulePublicEntityService<ActionCollection> actionCollectionModulePublicEntityService;
    private final DatasourceService datasourceService;

    public CrudPackageServiceImpl(
            PackageRepository repository,
            WorkspaceService workspaceService,
            WorkspacePermission workspacePermission,
            PolicyGenerator policyGenerator,
            PackagePermission packagePermission,
            CrudModuleService crudModuleService,
            SessionUserService sessionUserService,
            TransactionalOperator transactionalOperator,
            ModulePublicEntityService<NewAction> newActionModulePublicEntityService,
            ModulePublicEntityService<ActionCollection> actionCollectionModulePublicEntityService,
            DatasourceService datasourceService) {
        super(repository);
        this.repository = repository;
        this.workspaceService = workspaceService;
        this.workspacePermission = workspacePermission;
        this.policyGenerator = policyGenerator;
        this.packagePermission = packagePermission;
        this.crudModuleService = crudModuleService;
        this.sessionUserService = sessionUserService;
        this.transactionalOperator = transactionalOperator;
        this.newActionModulePublicEntityService = newActionModulePublicEntityService;
        this.actionCollectionModulePublicEntityService = actionCollectionModulePublicEntityService;
        this.datasourceService = datasourceService;
    }

    @Override
    public Mono<Package> findByBranchNameAndDefaultPackageId(
            String branchName,
            String defaultPackageId,
            List<String> projectionFieldNames,
            AclPermission aclPermission) {
        if (StringUtils.hasText(branchName)) {
            return repository
                    .findByBranchNameAndDefaultPackageId(
                            defaultPackageId, projectionFieldNames, branchName, aclPermission)
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND,
                            FieldName.PACKAGE,
                            defaultPackageId + "," + branchName)));
        }
        return repository
                .findById(defaultPackageId, projectionFieldNames, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE, defaultPackageId)));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<PackageDTO> createPackage(PackageDTO packageToBeCreated, String workspaceId) {
        if (ValidationUtils.isEmptyParam(packageToBeCreated.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }
        if (ValidationUtils.isEmptyParam(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        return workspaceService
                .findById(workspaceId, workspacePermission.getPackageCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE_ID, workspaceId)))
                .zipWith(userMono)
                .flatMap(tuple2 -> {
                    Workspace workspace = tuple2.getT1();
                    User currentUser = tuple2.getT2();
                    Package newPackage = new Package();
                    newPackage.setWorkspaceId(workspace.getId());
                    newPackage.setPackageUUID(new ObjectId().toString());

                    newPackage.setUnpublishedPackage(packageToBeCreated);
                    packageToBeCreated.setCustomJSLibs(new HashSet<>());
                    newPackage.setPublishedPackage(new PackageDTO());

                    Set<Policy> policies = policyGenerator.getAllChildPolicies(
                            workspace.getPolicies(), Workspace.class, Package.class);
                    newPackage.setPolicies(policies);
                    newPackage.setModifiedBy(currentUser.getUsername());

                    return createSuffixedPackage(newPackage, packageToBeCreated.getName(), 0)
                            .flatMap(createdPackage -> setTransientFieldsFromPackageToPackageDTO(
                                    createdPackage, createdPackage.getUnpublishedPackage()));
                });
    }

    @Override
    public Mono<UpdateResult> update(String contextId, Map<String, Object> fieldNameValueMap, String branchName) {
        String defaultIdPath = "id";
        if (!isBlank(branchName)) {
            // TODO: Use QDSL here
            defaultIdPath = "gitPackageMetadata.defaultPackageId";
        }
        return repository.updateFieldByDefaultIdAndBranchName(
                contextId,
                defaultIdPath,
                fieldNameValueMap,
                branchName,
                "gitPackageMetadata.branchName",
                MANAGE_PACKAGES);
    }

    @Override
    public Flux<Package> getAllPublishedPackagesByUniqueRef(String workspaceId, List<ExportableModule> packageList) {
        return repository.findAllPublishedByUniqueReference(workspaceId, packageList, Optional.empty());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<List<PackageDTO>> getAllEditablePackages() {
        return repository
                .findAllUserPackages(packagePermission.getEditPermission())
                .flatMap(aPackage -> generatePackageByViewMode(aPackage, ResourceModes.EDIT))
                .collectList();
    }

    @Override
    public Mono<PackageDTO> generatePackageByViewMode(Package aPackage, ResourceModes resourceMode) {
        PackageDTO packageDTO;
        if (aPackage.getDeletedAt() != null) {
            return Mono.empty();
        }

        if (resourceMode.equals(ResourceModes.EDIT)) {
            packageDTO = aPackage.getUnpublishedPackage();
        } else {
            packageDTO = aPackage.getPublishedPackage();
        }
        return setTransientFieldsFromPackageToPackageDTO(aPackage, packageDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<PackageDetailsDTO> getPackageDetails(String packageId) {
        // Retrieve package data with read permission
        Mono<PackageDTO> packageDataMono = repository
                .findById(packageId, packagePermission.getReadPermission())
                .flatMap(aPackage -> this.generatePackageByViewMode(aPackage, ResourceModes.EDIT))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)));

        // Retrieve all module DTOs for the package in edit mode
        Mono<List<ModuleDTO>> modulesMono = crudModuleService.getAllModuleDTOs(packageId, ResourceModes.EDIT);

        // Combine the results of the above Monos
        return Mono.zip(packageDataMono, modulesMono).flatMap(tuple -> {
            // Extract packageDTO and moduleDTOs from the tuple
            PackageDTO packageDTO = tuple.getT1();
            List<ModuleDTO> moduleDTOS = tuple.getT2();

            // Create PackageDetailsDTO and set package data
            PackageDetailsDTO packageDetailsDTO = new PackageDetailsDTO();
            packageDetailsDTO.setPackageData(packageDTO);

            // Set modules data
            packageDetailsDTO.setModules(moduleDTOS);

            // Fetch metadata for each module and set in the PackageDetailsDTO
            return Flux.fromIterable(moduleDTOS)
                    .flatMap(moduleDTO -> fetchPublicEntity(moduleDTO).flatMap(publicEntity -> {
                        final ModuleMetadata moduleMetadata = new ModuleMetadata();
                        moduleMetadata.setModuleId(moduleDTO.getId());
                        String dsName = FieldName.UNUSED_DATASOURCE;
                        if (publicEntity instanceof ActionDTO) {
                            ActionDTO actionDTO = (ActionDTO) publicEntity;
                            moduleMetadata.setPluginType(actionDTO.getPluginType());
                            moduleMetadata.setPluginId(actionDTO.getPluginId());
                            dsName = actionDTO.getDatasource().getName();
                        } else if (publicEntity instanceof ActionCollectionDTO) {
                            ActionCollectionDTO collectionDTO = (ActionCollectionDTO) publicEntity;
                            moduleMetadata.setPluginType(collectionDTO.getPluginType());
                            moduleMetadata.setPluginId(collectionDTO.getPluginId());
                            if (collectionDTO.getActions().size() > 0) {
                                dsName = collectionDTO
                                        .getActions()
                                        .get(0)
                                        .getDatasource()
                                        .getName();
                            }
                        }

                        return datasourceService
                                .findByNameAndWorkspaceId(dsName, packageDTO.getWorkspaceId(), Optional.empty())
                                .switchIfEmpty(Mono.defer(() -> Mono.just(new Datasource())))
                                .map(dbDatasource -> {
                                    moduleMetadata.setDatasourceId(dbDatasource.getId());
                                    return moduleMetadata;
                                });
                    }))
                    .collectList()
                    .doOnNext(packageDetailsDTO::setModulesMetadata)
                    .then(Mono.just(packageDetailsDTO));
        });
    }

    private Mono<Reusable> fetchPublicEntity(ModuleDTO moduleDTO) {
        switch (moduleDTO.getType()) {
            case QUERY_MODULE:
                return newActionModulePublicEntityService.getPublicEntity(moduleDTO.getId());
            case JS_MODULE:
                return actionCollectionModulePublicEntityService.getPublicEntity(moduleDTO.getId());
            default:
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<PackageDTO> updatePackage(PackageDTO packageResource, String packageId) {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        return repository
                .findById(packageId, packagePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)))
                .zipWith(userMono)
                .flatMap(tuple2 -> {
                    Package dbPackage = tuple2.getT1();
                    User currentUser = tuple2.getT2();
                    Update updateObj = prepareUpdatableFieldsForPackage(packageResource);

                    if (updateObj.getUpdateObject().isEmpty()) {
                        return setTransientFieldsFromPackageToPackageDTO(dbPackage, dbPackage.getUnpublishedPackage());
                    }
                    updateObj.set(fieldName(QPackage.package$.updatedAt), Instant.now());
                    updateObj.set(fieldName(QPackage.package$.modifiedBy), currentUser.getUsername());

                    return repository
                            .updateAndReturn(packageId, updateObj, Optional.of(packagePermission.getEditPermission()))
                            .flatMap(repository::setUserPermissionsInObject)
                            .flatMap(updatedPackage -> setTransientFieldsFromPackageToPackageDTO(
                                    updatedPackage, updatedPackage.getUnpublishedPackage()));
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<PackageDTO> deletePackage(String packageId) {
        Mono<Package> packageMono = repository
                .findById(packageId, packagePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)))
                .cache();

        return packageMono.flatMap(aPackage -> crudModuleService
                .archiveModulesByPackageId(packageId)
                .then(repository.archiveById(aPackage.getId()))
                .as(transactionalOperator::transactional)
                .then(setTransientFieldsFromPackageToPackageDTO(aPackage, aPackage.getUnpublishedPackage())));
    }

    @Override
    public Flux<Package> getUniquePublishedReference(Set<String> packageIds) {
        List<String> projectionFields = List.of(
                completeFieldName(QPackage.package$.id),
                completeFieldName(QPackage.package$.publishedPackage.name),
                completeFieldName(QPackage.package$.packageUUID),
                completeFieldName(QPackage.package$.version));
        return repository.findAllByIds(new ArrayList<>(packageIds), projectionFields);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ConsumablePackagesAndModulesDTO> getAllPackagesForConsumer(String workspaceId) {
        return repository
                .findAllConsumablePackages(workspaceId, packagePermission.getReadPermission())
                .flatMap(aPackage -> generatePackageByViewMode(aPackage, ResourceModes.VIEW))
                .collectList()
                .flatMap(packageDTOS -> {
                    List<String> packageIds =
                            packageDTOS.stream().map(PackageDTO::getId).toList();

                    return crudModuleService.getAllConsumableModules(packageIds).flatMap(moduleDTOS -> {
                        ConsumablePackagesAndModulesDTO consumablePackagesAndModulesDTO =
                                new ConsumablePackagesAndModulesDTO();
                        consumablePackagesAndModulesDTO.setPackages(packageDTOS);
                        consumablePackagesAndModulesDTO.setModules(moduleDTOS);

                        return Mono.just(consumablePackagesAndModulesDTO);
                    });
                });
    }

    private Update prepareUpdatableFieldsForPackage(PackageDTO packageResource) {
        Update updateObj = new Update();
        String iconPath = fieldName(QPackage.package$.unpublishedPackage) + "."
                + fieldName(QPackage.package$.unpublishedPackage.icon);
        String colorPath = fieldName(QPackage.package$.unpublishedPackage) + "."
                + fieldName(QPackage.package$.unpublishedPackage.color);
        String namePath = fieldName(QPackage.package$.unpublishedPackage) + "."
                + fieldName(QPackage.package$.unpublishedPackage.name);

        ObjectUtils.setIfNotEmpty(updateObj, iconPath, packageResource.getIcon());
        ObjectUtils.setIfNotEmpty(updateObj, colorPath, packageResource.getColor());
        ObjectUtils.setIfNotEmpty(updateObj, namePath, packageResource.getName());

        return updateObj;
    }

    private Mono<Package> createSuffixedPackage(Package requestedPackage, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        requestedPackage.getUnpublishedPackage().setName(actualName);

        if (!StringUtils.hasLength(requestedPackage.getUnpublishedPackage().getColor())) {
            requestedPackage.getUnpublishedPackage().setColor(getRandomPackageCardColor());
        }

        return repository
                .save(requestedPackage)
                .flatMap(repository::setUserPermissionsInObject)
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null && error.getMessage().contains("ws_pkg_name_deleted_at_uindex")) {
                        if (suffix > 5) {
                            return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_PAGE_RELOAD, name));
                        } else {
                            return createSuffixedPackage(requestedPackage, name, suffix + 1);
                        }
                    }
                    throw error;
                });
    }

    public String getRandomPackageCardColor() {
        int randomColorIndex = (int) (System.currentTimeMillis() % ApplicationConstants.APP_CARD_COLORS.length);
        return ApplicationConstants.APP_CARD_COLORS[randomColorIndex];
    }
}
