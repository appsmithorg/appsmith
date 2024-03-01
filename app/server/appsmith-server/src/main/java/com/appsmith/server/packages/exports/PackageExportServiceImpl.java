package com.appsmith.server.packages.exports;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.PackageJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.packages.permissions.PackagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RequiredArgsConstructor
@Slf4j
@Service
public class PackageExportServiceImpl implements ArtifactBasedExportService<Package, PackageJson> {

    private final CrudPackageService crudPackageService;
    private final PackagePermission packagePermission;
    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;
    private final ExportableService<Module> moduleExportableService;
    private final ExportableService<NewAction> newActionExportableService;
    private final ExportableService<ActionCollection> actionCollectionExportableService;
    private final ExportableService<ModuleInstance> moduleInstanceExportableService;
    private final Map<String, String> packageConstantsMap =
            Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.PACKAGE, FieldName.ID, FieldName.PACKAGE_ID);

    @Override
    public PackageJson createNewArtifactExchangeJson() {
        return new PackageJson();
    }

    @Override
    public AclPermission getArtifactExportPermission(Boolean isGitSync, Boolean exportWithConfiguration) {
        return packagePermission.getExportPermission(isGitSync, exportWithConfiguration);
    }

    @Override
    public Mono<Package> findExistingArtifactByIdAndBranchName(
            String artifactId, String branchName, AclPermission aclPermission) {
        // find the package with appropriate permission
        return crudPackageService
                .findByBranchNameAndDefaultPackageId(branchName, artifactId, null, aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, artifactId)));
    }

    @Override
    public Mono<Package> findExistingArtifactForAnalytics(String packageId) {
        return crudPackageService.findByBranchNameAndDefaultPackageId(null, packageId, null, null);
    }

    @Override
    public Map<String, Object> getExportRelatedArtifactData(ArtifactExchangeJson artifactExchangeJson) {

        PackageJson packageJson = (PackageJson) artifactExchangeJson;
        return Map.of(
                "moduleCount",
                packageJson.getModuleList().size(),
                "actionCount",
                packageJson.getActionList().size(),
                "JSObjectCount",
                packageJson.getActionCollectionList().size());
    }

    @Override
    public Mono<Void> getArtifactReadyForExport(
            Artifact exportableArtifact, ArtifactExchangeJson artifactExchangeJson, ExportingMetaDTO exportingMetaDTO) {

        Package aPackage = (Package) exportableArtifact;
        PackageJson packageJson = (PackageJson) artifactExchangeJson;

        GitArtifactMetadata gitArtifactMetadata = aPackage.getGitArtifactMetadata();
        Instant artifactLastCommittedAt = gitArtifactMetadata != null ? gitArtifactMetadata.getLastCommittedAt() : null;
        boolean isClientSchemaMigrated = !JsonSchemaVersions.clientVersion.equals(aPackage.getClientSchemaVersion());
        boolean isServerSchemaMigrated = !JsonSchemaVersions.serverVersion.equals(aPackage.getServerSchemaVersion());

        exportingMetaDTO.setArtifactLastCommittedAt(artifactLastCommittedAt);
        exportingMetaDTO.setClientSchemaMigrated(isClientSchemaMigrated);
        exportingMetaDTO.setServerSchemaMigrated(isServerSchemaMigrated);
        packageJson.setExportedPackage(aPackage);
        packageJson.setModifiedResources(new ModifiedResources());

        AclPermission exportPermission = modulePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());

        return crudModuleService
                .getAllModules(aPackage.getId(), exportPermission)
                .mapNotNull(Module::getId)
                .collectList()
                .doOnNext(exportingMetaDTO::setUnpublishedContextIds)
                .then();
    }

    @Override
    public Map<String, String> getConstantsMap() {
        return packageConstantsMap;
    }

    @Override
    public void sanitizeArtifactSpecificExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseArtifactObjective) {}

    @Override
    public Flux<Void> generateArtifactSpecificExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return exportableArtifactMono.flatMapMany(exportableArtifact -> {
            Mono<Package> packageMono = Mono.just((Package) exportableArtifact);
            PackageJson packageJson = (PackageJson) artifactExchangeJson;

            // Updates moduleId to name map in exportable resources.
            // Also, directly updates required modules information in package json
            Mono<Void> moduleExportablesMono = moduleExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, packageMono, packageJson);

            return moduleExportablesMono.flux();
        });
    }

    @Override
    public Flux<Void> generateArtifactComponentDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return exportableArtifactMono.flatMapMany(exportableArtifact -> {
            Mono<Package> packageMono = Mono.just((Package) exportableArtifact);
            PackageJson packageJson = (PackageJson) artifactExchangeJson;

            // Requires moduleIdToNameMap, pluginMap.
            // Updates collectionId to name map in exportable resources.
            // Also, directly updates required collection information in package json
            Mono<Void> actionCollectionExportablesMono = actionCollectionExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, packageMono, packageJson);

            // Requires datasourceIdToNameMap, moduleIdToNameMap, pluginMap, collectionIdToNameMap
            // Updates actionId to name map in exportable resources.
            // Also, directly updates required collection information in package json
            Mono<Void> newActionExportablesMono = newActionExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, packageMono, packageJson);

            // Requires moduleIdToNameMap
            // Updates moduleInstanceId to name map in exportable resources.
            // Also, directly updates required module instance information in package json
            Mono<Void> moduleInstanceExportablesMono = moduleInstanceExportableService.getExportableEntities(
                    exportingMetaDTO, mappedResourcesDTO, packageMono, packageJson);

            Mono<Void> combinedActionExportablesMono = actionCollectionExportablesMono.then(newActionExportablesMono);

            return combinedActionExportablesMono
                    .then(Mono.defer(() -> moduleInstanceExportablesMono))
                    .flux();
        });
    }
}
