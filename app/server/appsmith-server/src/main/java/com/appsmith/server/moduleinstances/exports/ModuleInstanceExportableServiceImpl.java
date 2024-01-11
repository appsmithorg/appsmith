package com.appsmith.server.moduleinstances.exports;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.packages.crud.CrudPackageService;
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
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

@Service
public class ModuleInstanceExportableServiceImpl extends ModuleInstanceExportableServiceCECompatibleImpl
        implements ExportableService<ModuleInstance> {

    private final CrudModuleInstanceService crudModuleInstanceService;
    private final ModuleInstancePermission moduleInstancePermission;
    private final CrudModuleService crudModuleService;
    private final CrudPackageService crudPackageService;

    public ModuleInstanceExportableServiceImpl(
            CrudModuleInstanceService crudModuleInstanceService,
            ModuleInstancePermission moduleInstancePermission,
            CrudModuleService crudModuleService,
            CrudPackageService crudPackageService) {
        this.crudModuleInstanceService = crudModuleInstanceService;
        this.moduleInstancePermission = moduleInstancePermission;
        this.crudModuleService = crudModuleService;
        this.crudPackageService = crudPackageService;
    }

    // Requires pageIdToNameMap
    // Updates moduleInstanceId to name map and moduleIdToUUIDMap in exportable resources. Also directly updates
    // required module instance information in application json
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        Optional<AclPermission> optionalPermission = Optional.ofNullable(moduleInstancePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration()));

        Flux<ModuleInstance> moduleInstanceFlux = crudModuleInstanceService
                .findByPageIds(exportingMetaDTO.getUnpublishedPages(), optionalPermission)
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
                            applicationJson.setModuleList(modules);
                        }
                    })
                    .then();
        });

        return moduleInstanceFlux
                .doOnNext(moduleInstance -> sourceModuleIdsSet.add(moduleInstance.getSourceModuleId()))
                .collectList()
                .map(moduleInstanceList -> {
                    mapNameToIdForExportableEntities(mappedExportableResourcesDTO, moduleInstanceList);
                    return moduleInstanceList;
                })
                .map(moduleInstanceList -> {
                    Set<String> updatedModuleInstancesSet = new HashSet<>();
                    moduleInstanceList.forEach(moduleInstance -> {
                        ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
                        ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();
                        ModuleInstanceDTO moduleInstanceDTO =
                                unpublishedModuleInstance != null ? unpublishedModuleInstance : publishedModuleInstance;
                        String moduleInstanceName = moduleInstanceDTO != null
                                ? moduleInstanceDTO.getName() + NAME_SEPARATOR + moduleInstanceDTO.getPageId()
                                : null;
                        // TODO: check whether resource updated after last commit - move to a function
                        String pageName = moduleInstanceDTO.getPageId();

                        boolean isPageUpdated = ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName);
                        Instant moduleInstanceUpdatedAt = moduleInstance.getUpdatedAt();
                        boolean isModuleInstanceUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getApplicationLastCommittedAt() == null
                                || isPageUpdated
                                || moduleInstanceUpdatedAt == null
                                || exportingMetaDTO
                                        .getApplicationLastCommittedAt()
                                        .isBefore(moduleInstanceUpdatedAt);
                        if (isModuleInstanceUpdated && moduleInstanceName != null) {
                            updatedModuleInstancesSet.add(moduleInstanceName);
                        }
                        moduleInstance.sanitiseToExportDBObject();
                    });

                    if (!moduleInstanceList.isEmpty()) {
                        if (!updatedModuleInstancesSet.isEmpty()) {
                            applicationJson
                                    .getUpdatedResources()
                                    .put(FieldName.MODULE_INSTANCE_LIST, updatedModuleInstancesSet);
                        }
                        applicationJson.setModuleInstanceList(moduleInstanceList);
                    }

                    return moduleInstanceList;
                })
                .then(Mono.defer(() -> updateModulesListMono));
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<ModuleInstance> moduleInstanceList) {
        moduleInstanceList.forEach(moduleInstance -> {
            moduleInstance.setPolicies(null);
            moduleInstance.setApplicationId(null);

            // Set unique id for module instance
            if (moduleInstance.getUnpublishedModuleInstance() != null) {
                ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
                moduleInstanceDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(moduleInstanceDTO.getPageId() + EDIT));

                final String updatedModuleInstanceId =
                        moduleInstanceDTO.getPageId() + "_" + moduleInstanceDTO.getName();
                mappedExportableResourcesDTO
                        .getModuleInstanceIdToNameMap()
                        .put(moduleInstance.getId(), updatedModuleInstanceId);
                moduleInstance.setId(updatedModuleInstanceId);
            }
            if (moduleInstance.getPublishedModuleInstance() != null) {
                ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getPublishedModuleInstance();
                moduleInstanceDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(moduleInstanceDTO.getPageId() + VIEW));

                if (!mappedExportableResourcesDTO
                        .getModuleInstanceIdToNameMap()
                        .containsValue(moduleInstance.getId())) {
                    final String updatedModuleInstanceId =
                            moduleInstanceDTO.getPageId() + "_" + moduleInstanceDTO.getName();
                    mappedExportableResourcesDTO
                            .getModuleInstanceIdToNameMap()
                            .put(moduleInstance.getId(), updatedModuleInstanceId);
                    moduleInstance.setId(updatedModuleInstanceId);
                }
            }
        });
        return Set.of();
    }
}
