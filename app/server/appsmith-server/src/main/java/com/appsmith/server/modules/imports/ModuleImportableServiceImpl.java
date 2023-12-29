package com.appsmith.server.modules.imports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.packages.crud.CrudPackageService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ModuleImportableServiceImpl implements ImportableService<Module> {

    private final CrudPackageService crudPackageService;
    private final CrudModuleService crudModuleService;

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {
        List<ExportableModule> moduleList = CollectionUtils.isEmpty(applicationJson.getModuleList())
                ? new ArrayList<>()
                : applicationJson.getModuleList();

        Map<String, Module> moduleUUIDToModuleMap = mappedImportableResourcesDTO.getModuleUUIDToModuleMap();
        Map<String, ExportableModule> moduleUUIDToExportableModuleMap =
                mappedImportableResourcesDTO.getModuleUUIDToExportableModuleMap();

        moduleList.stream().forEach(exportableModule -> {
            moduleUUIDToExportableModuleMap.put(exportableModule.getModuleUUID(), exportableModule);
        });

        // For each package in this list, check if the workspace already has such a definition
        // If it does, we can assume that module instance import will succeed validation (if ACL allows)
        //     For this, map the package UUID-version combo to the existing packageId in workspace
        // If it does not, we will need to mark the corresponding module instances as invalid
        //     Absence of UUID-version entry in the map will indicate such a state

        // No actual import is performed for packages here
        return crudPackageService
                .getAllPublishedPackagesByUniqueRef(importingMetaDTO.getWorkspaceId(), moduleList)
                .flatMap(aPackage -> {
                    // TODO: What happens if this instance has also created a package from this unique ref ,
                    //  and has reached this version, but with a separate interface/definition ?
                    return crudModuleService
                            .getAllModules(aPackage.getId())
                            .doOnNext(module -> {
                                moduleUUIDToModuleMap.put(module.getModuleUUID(), module);
                            })
                            .collectList();
                })
                .then();
    }
}
