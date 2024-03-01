package com.appsmith.server.packages.imports;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageImportDTO;
import com.appsmith.server.dtos.PackageJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Slf4j
@Service
public class PackageImportServiceImpl implements ArtifactBasedImportService<Package, PackageImportDTO, PackageJson> {

    private final CrudPackageService crudPackageService;
    private final NewActionService newActionService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final PackagePermission packagePermission;
    private final ModulePermission modulePermission;
    private final ActionPermission actionPermission;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;
    private final ImportableService<Module> moduleImportableService;
    private final ImportableService<ModuleInstance> moduleInstanceImportableService;

    /**
     * This map keeps constants which are specific to context of Package, parallel to other Artifacts.
     * i.e. Artifact --> Package
     * i.e. ID --> applicationId
     */
    protected final Map<String, String> packageConstantsMap =
            Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.PACKAGE, FieldName.ID, FieldName.PACKAGE_ID);

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForImportingArtifact(
            Set<String> userPermissionGroups) {
        return ImportArtifactPermissionProvider.builder(
                        packagePermission,
                        modulePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getPackageCreatePermission())
                .permissionRequiredToCreateDatasource(true)
                .permissionRequiredToEditDatasource(true)
                .currentUserPermissionGroups(userPermissionGroups)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForUpdatingArtifact(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        packagePermission,
                        modulePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(packagePermission.getEditPermission())
                .allPermissionsRequired()
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    /**
     * If the application is connected to git, then the user must have edit permission on the application.
     * If user is importing application from Git, create application permission is already checked by the
     * caller method, so it's not required here.
     * Other permissions are not required because Git is the source of truth for the application and Git
     * Sync is a system level operation to get the latest code from Git. If the user does not have some
     * permissions on the Application e.g. create page, that'll be checked when the user tries to create a page.
     */
    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForConnectingToGit(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        packagePermission,
                        modulePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetArtifact(packagePermission.getEditPermission())
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForRestoringSnapshot(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        packagePermission,
                        modulePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(packagePermission.getEditPermission())
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForMergingJsonWithArtifact(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        packagePermission,
                        modulePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(packagePermission.getEditPermission())
                .allPermissionsRequired()
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    /**
     * this method removes the package name from Json file as updating the package-name is not supported via import
     * this avoids name conflict during import flow within workspace
     *
     * @param packageId            : ID of the package which has been saved.
     * @param artifactExchangeJson : the ArtifactExchangeJSON which is getting imported
     */
    @Override
    public void setJsonArtifactNameToNullBeforeUpdate(String packageId, ArtifactExchangeJson artifactExchangeJson) {
        PackageJson packageJson = (PackageJson) artifactExchangeJson;
        if (StringUtils.hasText(packageId) && (packageJson).getExportedPackage() != null) {
            packageJson.getExportedPackage().getUnpublishedPackage().setName(null);
        }
    }

    protected List<Mono<Void>> getModuleDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        // Requires moduleNameMap, moduleNameToOldNameMap, pluginMap and datasourceNameToIdMap to be present in
        // importable
        // resources.
        // Updates actionResultDTO in importable resources.
        // Also, directly updates required information in DB
        Mono<Void> importedNewActionsMono = newActionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        // Requires moduleNameMap, moduleNameToOldNameMap, pluginMap and actionResultDTO to be present in importable
        // resources.
        // Updates actionCollectionResultDTO in importable resources.
        // Also, directly updates required information in DB
        Mono<Void> importedActionCollectionsMono = actionCollectionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        Mono<Void> combinedActionImportablesMono = importedNewActionsMono.then(importedActionCollectionsMono);

        Mono<Void> importedModuleInstancesMono = moduleInstanceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        Mono<Void> moduleDependentsMono = importedModuleInstancesMono
                .thenMany(Flux.defer(() -> Flux.merge(combinedActionImportablesMono)))
                .then();

        return List.of(moduleDependentsMono);
    }

    @Override
    public PackageImportDTO getImportableArtifactDTO(
            ImportableArtifact importableArtifact, List<Datasource> datasourceList, String environmentId) {
        Package aPackage = (Package) importableArtifact;
        PackageImportDTO packageImportDTO = new PackageImportDTO();
        packageImportDTO.setAPackage(aPackage);

        Boolean isUnconfiguredDatasource = datasourceList.stream().anyMatch(datasource -> {
            DatasourceStorageDTO datasourceStorageDTO =
                    datasource.getDatasourceStorages().get(environmentId);
            if (datasourceStorageDTO == null) {
                // If this environment has not been configured,
                // We do not expect to find a storage, user will have to reconfigure
                return Boolean.FALSE;
            }
            return Boolean.FALSE.equals(datasourceStorageDTO.getIsConfigured());
        });

        if (Boolean.TRUE.equals(isUnconfiguredDatasource)) {
            packageImportDTO.setIsPartialImport(true);
            packageImportDTO.setUnConfiguredDatasourceList(datasourceList);
        } else {
            packageImportDTO.setIsPartialImport(false);
        }

        return packageImportDTO;
    }

    @Override
    public void updateArtifactExchangeJsonWithEntitiesToBeConsumed(
            ArtifactExchangeJson artifactExchangeJson, List<String> entitiesToImport) {

        PackageJson packageJson = (PackageJson) artifactExchangeJson;

        // Update the package JSON to prepare it for merging inside an existing package
        if (packageJson.getExportedPackage() != null) {
            // setting some properties to null so that target package is not updated by these properties
            packageJson.getExportedPackage().getUnpublishedPackage().setName(null);
            packageJson.getExportedPackage().setExportWithConfiguration(null);
        }

        // need to remove git sync id. Also filter modules if moduleToImport is not empty
        if (packageJson.getModuleList() != null) {
            List<Module> importedModuleList = packageJson.getModuleList().stream()
                    .filter(module -> module.getUnpublishedModule() != null
                            && (CollectionUtils.isEmpty(entitiesToImport)
                                    || entitiesToImport.contains(
                                            module.getUnpublishedModule().getName())))
                    .peek(module -> module.setGitSyncId(null))
                    .collect(Collectors.toList());
            packageJson.setModuleList(importedModuleList);
        }
        if (packageJson.getActionList() != null) {
            List<NewAction> importedNewActionList = packageJson.getActionList().stream()
                    .filter(newAction -> newAction.getUnpublishedAction() != null
                            && (CollectionUtils.isEmpty(entitiesToImport)
                                    || entitiesToImport.contains(
                                            newAction.getUnpublishedAction().getPageId())))
                    .peek(newAction ->
                            newAction.setGitSyncId(null)) // setting this null so that this action can be imported again
                    .collect(Collectors.toList());
            packageJson.setActionList(importedNewActionList);
        }
        if (packageJson.getActionCollectionList() != null) {
            List<ActionCollection> importedActionCollectionList = packageJson.getActionCollectionList().stream()
                    .filter(actionCollection -> (CollectionUtils.isEmpty(entitiesToImport)
                            || entitiesToImport.contains(
                                    actionCollection.getUnpublishedCollection().getPageId())))
                    .peek(actionCollection -> actionCollection.setGitSyncId(
                            null)) // setting this null so that this action collection can be imported again
                    .collect(Collectors.toList());
            packageJson.setActionCollectionList(importedActionCollectionList);
        }
    }

    @Override
    public void syncClientAndSchemaVersion(ArtifactExchangeJson artifactExchangeJson) {
        PackageJson packageJson = (PackageJson) artifactExchangeJson;
        Package importedPackage = packageJson.getExportedPackage();
        importedPackage.setServerSchemaVersion(packageJson.getServerSchemaVersion());
        importedPackage.setClientSchemaVersion(packageJson.getClientSchemaVersion());
    }

    @Override
    public Mono<Void> generateArtifactSpecificImportableEntities(
            ArtifactExchangeJson artifactExchangeJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        // Persists relevant information and updates mapped resources
        return Mono.empty().then();
    }

    @Override
    public Mono<Boolean> isArtifactConnectedToGit(String artifactId) {
        return Mono.just(false);
    }

    @Override
    public Mono<Package> updateAndSaveArtifactInContext(
            ImportableArtifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<User> currentUserMono) {
        Package aPackage = (Package) importableArtifact;
        PackageDTO packageDTO = aPackage.getUnpublishedPackage();

        aPackage.setExportWithConfiguration(null);
        aPackage.setWorkspaceId(importingMetaDTO.getWorkspaceId());
        aPackage.setPolicies(null);

        Mono<Package> importPackageMono;

        if (!StringUtils.hasText(importingMetaDTO.getArtifactId())) {
            // Create a new package
            // Only if the workspace does not already have this packageUUID or packageName present
            // Else, error out with the relevant error message
            packageDTO.setPackageUUID(aPackage.getPackageUUID());
            packageDTO.setVersion(aPackage.getVersion());
            importPackageMono =
                    crudPackageService.createPackageWithPreciseName(packageDTO, importingMetaDTO.getWorkspaceId());
        } else {
            // Update existing package
            // Do not copy the packageUUID, interpret incoming modules as new entities meant to be combined
            // with the existing package

            // this can be a git sync, import module from template, update package with json, restore snapshot
            importPackageMono = crudPackageService
                    .findById(
                            importingMetaDTO.getArtifactId(),
                            importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication())
                    .switchIfEmpty(Mono.defer(() -> {
                        log.error(
                                "No package found with id: {} and permission: {}",
                                importingMetaDTO.getArtifactId(),
                                importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.PACKAGE,
                                importingMetaDTO.getArtifactId()));
                    }))
                    .cache();
        }

        return importPackageMono
                .elapsed()
                .map(tuples -> {
                    log.debug("time to create or update package object: {}", tuples.getT1());
                    return tuples.getT2();
                })
                .onErrorResume(error -> {
                    log.error("Error while creating or updating package object", error);
                    return Mono.error(error);
                });
    }

    @Override
    public Mono<Package> updateImportableArtifact(ImportableArtifact importableArtifact) {
        return Mono.just((Package) importableArtifact);
    }

    @Override
    public Mono<Package> updateImportableEntities(
            ImportableArtifact importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        return newActionImportableService
                .updateImportedEntities(importableContext, importingMetaDTO, mappedImportableResourcesDTO)
                .then(moduleImportableService.updateImportedEntities(
                        importableContext, importingMetaDTO, mappedImportableResourcesDTO))
                .thenReturn((Package) importableContext);
    }

    @Override
    public Map<String, Object> createImportAnalyticsData(
            ArtifactExchangeJson artifactExchangeJson, ImportableArtifact importableArtifact) {

        Package aPackage = (Package) importableArtifact;
        PackageJson packageJson = (PackageJson) artifactExchangeJson;

        int jsObjectCount = CollectionUtils.isEmpty(packageJson.getActionCollectionList())
                ? 0
                : packageJson.getActionCollectionList().size();
        int actionCount = CollectionUtils.isEmpty(packageJson.getActionList())
                ? 0
                : packageJson.getActionList().size();

        return Map.of(
                FieldName.PACKAGE_ID,
                aPackage.getId(),
                FieldName.WORKSPACE_ID,
                aPackage.getWorkspaceId(),
                "moduleCount",
                packageJson.getModuleList().size(),
                "actionCount",
                actionCount,
                "JSObjectCount",
                jsObjectCount);
    }

    @Override
    public Flux<Void> generateArtifactContextIndependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        // Updates moduleNameToIdMap and moduleNameMap in importable resources.
        // Also, directly updates required information in DB
        Mono<Void> importedModulesMono = moduleImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        return Flux.merge(importedModulesMono);
    }

    @Override
    public Flux<Void> generateArtifactContextDependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        List<Mono<Void>> moduleDependentImportables = getModuleDependentImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        return Flux.merge(moduleDependentImportables);
    }

    @Override
    public String validateArtifactSpecificFields(ArtifactExchangeJson artifactExchangeJson) {
        PackageJson importedDoc = (PackageJson) artifactExchangeJson;
        String errorField = "";
        if (CollectionUtils.isEmpty(importedDoc.getModuleList())) {
            errorField = FieldName.MODULE_LIST;
        } else if (importedDoc.getActionList() == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDoc.getDatasourceList() == null) {
            errorField = FieldName.DATASOURCE;
        }

        return errorField;
    }

    @Override
    public Map<String, String> getArtifactSpecificConstantsMap() {
        return packageConstantsMap;
    }

    @Override
    public Mono<Set<String>> getDatasourceIdSetConsumedInArtifact(String defaultApplicationId) {
        return newActionService
                .findAllByPackageIdAndViewMode(defaultApplicationId, false)
                .filter(newAction -> StringUtils.hasText(
                        newAction.getUnpublishedAction().getDatasource().getId()))
                .mapNotNull(newAction ->
                        newAction.getUnpublishedAction().getDatasource().getId())
                .collect(Collectors.toSet());
    }
}
