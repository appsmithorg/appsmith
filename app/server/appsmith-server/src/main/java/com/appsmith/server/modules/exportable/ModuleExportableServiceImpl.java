package com.appsmith.server.modules.exportable;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.dtos.PackageJson;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.constants.ResourceModes.EDIT;

@RequiredArgsConstructor
@Service
public class ModuleExportableServiceImpl implements ExportableService<Module> {

    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;

    @Override
    public ArtifactBasedExportableService<Module, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        // This is already a specific service
        return null;
    }

    // Updates moduleId to name map in exportable resources.
    // Also, directly updates required modules information in package json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends ExportableArtifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        PackageJson packageJson = (PackageJson) artifactExchangeJson;
        AclPermission exportPermission = modulePermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());

        return crudModuleService
                .getAllModules(exportingMetaDTO.getArtifactId(), exportPermission)
                .filter(module -> module.getUnpublishedModule() != null)
                .collectList()
                .map(moduleList -> {
                    Set<String> updatedModuleSet = new HashSet<>();

                    moduleList.forEach(module -> {
                        mappedExportableResourcesDTO
                                .getContextIdToNameMap()
                                .put(
                                        module.getId() + EDIT,
                                        module.getUnpublishedModule().getName());

                        // Including updated modules list for git file storage
                        Instant moduleUpdatedAt = module.getUpdatedAt();
                        boolean isModuleUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getArtifactLastCommittedAt() == null
                                || moduleUpdatedAt == null
                                || exportingMetaDTO.getArtifactLastCommittedAt().isBefore(moduleUpdatedAt);
                        String moduleName = module.getUnpublishedModule().getName();
                        if (isModuleUpdated && moduleName != null) {
                            updatedModuleSet.add(moduleName);
                        }
                        module.sanitiseToExportDBObject();
                    });
                    packageJson.setModuleList(moduleList);
                    packageJson.getModifiedResources().putResource(FieldName.MODULE_LIST, updatedModuleSet);

                    return moduleList;
                })
                .then();
    }
}
