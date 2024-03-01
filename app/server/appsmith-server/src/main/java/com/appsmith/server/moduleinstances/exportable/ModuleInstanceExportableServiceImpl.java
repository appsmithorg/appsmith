package com.appsmith.server.moduleinstances.exportable;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.packages.crud.CrudPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.server.constants.FieldName.PACKAGE;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION;

@RequiredArgsConstructor
@Service
public class ModuleInstanceExportableServiceImpl extends ModuleInstanceExportableServiceCECompatibleImpl
        implements ExportableService<ModuleInstance> {

    private final ModuleInstancePermission moduleInstancePermission;
    private final CrudModuleService crudModuleService;
    private final CrudPackageService crudPackageService;
    protected final ArtifactBasedExportableService<ModuleInstance, Application> applicationExportableService;
    protected final ArtifactBasedExportableService<ModuleInstance, Package> packageExportableService;

    @Override
    public ArtifactBasedExportableService<ModuleInstance, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return switch (exportingMetaDTO.getArtifactType()) {
            case APPLICATION -> applicationExportableService;
            case PACKAGE -> packageExportableService;
            default -> null;
        };
    }

    // Requires contextIdToNameMap
    // Updates moduleInstanceId to name map and moduleIdToUUIDMap in exportable resources. Also directly updates
    // required module instance information in artifact json
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedExportableService<ModuleInstance, ?> artifactBasedExportableService =
                getArtifactBasedExportableService(exportingMetaDTO);

        AclPermission exportPermission = moduleInstancePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());

        Flux<ModuleInstance> moduleInstanceFlux = artifactBasedExportableService
                .findByContextIdsForExport(exportingMetaDTO.getUnpublishedContextIds(), exportPermission)
                .filter(moduleInstance ->
                        moduleInstance.getUnpublishedModuleInstance().getDeletedAt() == null);

        final Set<String> sourceModuleIdsSet = ConcurrentHashMap.newKeySet();

        Mono<Map<String, Package>> packageInfoMapMono = crudModuleService
                .findPackageIdsByModuleIds(sourceModuleIdsSet, Optional.empty())
                .collect(Collectors.toSet())
                .flatMapMany(crudPackageService::getUniquePublishedReference)
                .collectMap(Package::getId, aPackage -> aPackage);

        Mono<Void> updateModulesListMono = packageInfoMapMono.flatMap(packageInfoMap -> {
            return crudModuleService
                    .findExportableModuleDataByIds(sourceModuleIdsSet, Optional.empty())
                    .map(module -> {
                        Package aPackage = packageInfoMap.get(module.getPackageId());
                        return new ExportableModule(aPackage, module);
                    })
                    .collectList()
                    .doOnNext(modules -> {
                        if (!modules.isEmpty()) {
                            artifactExchangeJson.setSourceModuleList(modules);
                        }
                    })
                    .then();
        });

        return moduleInstanceFlux
                .doOnNext(moduleInstance -> sourceModuleIdsSet.add(moduleInstance.getSourceModuleId()))
                .collectList()
                .map(moduleInstanceList -> {
                    mapNameToIdForExportableEntities(
                            exportingMetaDTO, mappedExportableResourcesDTO, moduleInstanceList);
                    return moduleInstanceList;
                })
                .map(moduleInstanceList -> {
                    Set<String> updatedModuleInstancesSet = new HashSet<>();
                    moduleInstanceList.forEach(moduleInstance -> {
                        ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
                        ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();
                        ModuleInstanceDTO moduleInstanceDTO =
                                unpublishedModuleInstance != null ? unpublishedModuleInstance : publishedModuleInstance;
                        String contextNameAtIdReference =
                                artifactBasedExportableService.getContextNameAtIdReference(moduleInstanceDTO);
                        String moduleInstanceName = moduleInstanceDTO != null
                                ? moduleInstanceDTO.getName() + NAME_SEPARATOR + contextNameAtIdReference
                                : null;

                        String contextListPath = artifactBasedExportableService.getContextListPath();
                        boolean isPageUpdated = ImportExportUtils.isContextNameInUpdatedList(
                                artifactExchangeJson, contextNameAtIdReference, contextListPath);
                        Instant moduleInstanceUpdatedAt = moduleInstance.getUpdatedAt();
                        boolean isModuleInstanceUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getArtifactLastCommittedAt() == null
                                || isPageUpdated
                                || moduleInstanceUpdatedAt == null
                                || exportingMetaDTO.getArtifactLastCommittedAt().isBefore(moduleInstanceUpdatedAt);
                        if (isModuleInstanceUpdated && moduleInstanceName != null) {
                            updatedModuleInstancesSet.add(moduleInstanceName);
                        }
                        moduleInstance.sanitiseToExportDBObject();
                    });

                    if (!moduleInstanceList.isEmpty()) {
                        if (!updatedModuleInstancesSet.isEmpty()) {
                            artifactExchangeJson
                                    .getModifiedResources()
                                    .putResource(FieldName.MODULE_INSTANCE_LIST, updatedModuleInstancesSet);
                        }
                        artifactExchangeJson.setModuleInstanceList(moduleInstanceList);
                    }

                    return moduleInstanceList;
                })
                .then(Mono.defer(() -> updateModulesListMono));
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            List<ModuleInstance> moduleInstanceList) {

        ArtifactBasedExportableService<ModuleInstance, ?> artifactBasedExportableService =
                this.getArtifactBasedExportableService(exportingMetaDTO);

        moduleInstanceList.forEach(moduleInstance -> {
            moduleInstance.setPolicies(null);
            moduleInstance.setWorkspaceId(null);

            // Set unique id for module instance
            if (moduleInstance.getUnpublishedModuleInstance() != null) {
                artifactBasedExportableService.mapExportableReferences(
                        mappedExportableResourcesDTO, moduleInstance, EDIT);
            }
            if (moduleInstance.getPublishedModuleInstance() != null) {
                artifactBasedExportableService.mapExportableReferences(
                        mappedExportableResourcesDTO, moduleInstance, VIEW);
            }
        });
        return Set.of();
    }
}
