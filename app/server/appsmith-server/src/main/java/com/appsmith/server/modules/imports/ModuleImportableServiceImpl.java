package com.appsmith.server.modules.imports;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.PackageJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.packages.permissions.PackagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@RequiredArgsConstructor
@Slf4j
@Service
public class ModuleImportableServiceImpl implements ImportableService<Module> {

    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;
    private final PackagePermission packagePermission;

    @Override
    public ArtifactBasedImportableService<Module, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        // This service is already artifact specific
        return null;
    }

    // Updates moduleNameToIdMap and moduleNameMap in importable resources.
    // Also, directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        PackageJson packageJson = (PackageJson) artifactExchangeJson;

        List<Module> importedModuleList = packageJson.getModuleList();

        // Import and save modules, also update the modules related fields in saved package
        assert importedModuleList != null : "Unable to find modules in the imported package";

        // For git-sync this will not be empty
        Mono<List<Module>> existingModulesMono = importableArtifactMono
                .flatMap(aPackage ->
                        crudModuleService.getAllModules(aPackage.getId(), null).collectList())
                .cache();

        Mono<Tuple2<List<Module>, Map<String, String>>> importedModulesMono = getImportModulesMono(
                        importedModuleList,
                        existingModulesMono,
                        importableArtifactMono,
                        importingMetaDTO,
                        mappedImportableResourcesDTO)
                .cache();

        Mono<Map<String, Module>> moduleNameMapMono =
                getModuleNameMapMono(importedModulesMono).doOnNext(mappedImportableResourcesDTO::setContextMap);

        return moduleNameMapMono.then(importedModulesMono).then();
    }

    @Override
    public Mono<Void> updateImportedEntities(
            ImportableArtifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        return Mono.empty().then();
    }

    private Mono<Map<String, Module>> getModuleNameMapMono(
            Mono<Tuple2<List<Module>, Map<String, String>>> importedModulesMono) {
        return importedModulesMono.map(objects -> {
            Map<String, Module> moduleNameMap = new HashMap<>();
            objects.getT1().forEach(module -> {
                // Save the map of moduleName and Module
                if (module.getUnpublishedModule() != null
                        && module.getUnpublishedModule().getName() != null) {
                    moduleNameMap.put(module.getUnpublishedModule().getName(), module);
                }
            });
            return moduleNameMap;
        });
    }

    private Mono<Tuple2<List<Module>, Map<String, String>>> getImportModulesMono(
            List<Module> importedModuleList,
            Mono<List<Module>> existingModulesMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return Mono.just(importedModuleList)
                .zipWith(existingModulesMono)
                .map(objects -> {
                    List<Module> importedModules = objects.getT1();
                    List<Module> existingModules = objects.getT2();
                    Map<String, String> newToOldNameMap;
                    if (importingMetaDTO.getAppendToArtifact()) {
                        newToOldNameMap = updateModulesBeforeMerge(existingModules, importedModules);
                    } else {
                        newToOldNameMap = Map.of();
                    }

                    mappedImportableResourcesDTO.setContextNewNameToOldName(newToOldNameMap);
                    return Tuples.of(importedModules, newToOldNameMap);
                })
                .zipWith(importableArtifactMono)
                .flatMap(objects -> {
                    List<Module> importedModules = objects.getT1().getT1();
                    Map<String, String> newToOldNameMap = objects.getT1().getT2();
                    Package aPackage = (Package) objects.getT2();
                    return importAndSaveModules(
                                    importedModules,
                                    aPackage,
                                    importingMetaDTO.getBranchName(),
                                    existingModulesMono,
                                    importingMetaDTO)
                            .collectList()
                            .zipWith(Mono.just(newToOldNameMap));
                })
                .onErrorResume(throwable -> {
                    log.error("Error importing modules", throwable);
                    return Mono.error(throwable);
                })
                .elapsed()
                .map(objects -> {
                    log.debug("time to import {} modules: {}", objects.getT2().size(), objects.getT1());
                    return objects.getT2();
                });
    }

    /**
     * Method to
     * - save imported modules
     * - update the mongoEscapedWidgets if present in the module
     * - set the policies for the module
     * - update default resource ids along with branch-name if the aPackage is connected to git
     *
     * @param modules         module list extracted from the imported JSON file
     * @param aPackage        saved aPackage where modules needs to be added
     * @param branchName      to which branch modules should be imported if aPackage is connected to git
     * @param existingModules existing modules in DB if the aPackage is connected to git
     * @return flux of saved modules in DB
     */
    private Flux<Module> importAndSaveModules(
            List<Module> modules,
            Package aPackage,
            String branchName,
            Mono<List<Module>> existingModules,
            ImportingMetaDTO importingMetaDTO) {

        modules.forEach(module -> {
            module.setPackageId(aPackage.getId());
            module.setPackageUUID(aPackage.getPackageUUID());
            if (module.getUnpublishedModule() != null) {
                crudModuleService.generateAndSetPolicies(aPackage, module);
                if (module.getUnpublishedModule().getLayouts() != null) {
                    module.getUnpublishedModule().getLayouts().forEach(layout -> {
                        String layoutId = new ObjectId().toString();
                        layout.setId(layoutId);
                    });
                }
            }
        });

        return existingModules
                .flatMapMany(existingSavedModules -> {
                    Map<String, Module> savedModulesGitIdToModuleMap = new HashMap<>();

                    existingSavedModules.stream()
                            .filter(module -> !StringUtils.isEmpty(module.getGitSyncId()))
                            .forEach(module -> savedModulesGitIdToModuleMap.put(module.getGitSyncId(), module));

                    return Flux.fromIterable(modules).flatMap(importedModule -> {
                        log.debug(
                                "Importing module: {}",
                                importedModule.getUnpublishedModule().getName());
                        // Check if the module has gitSyncId and if it's already in DB
                        if (importedModule.getGitSyncId() != null
                                && savedModulesGitIdToModuleMap.containsKey(importedModule.getGitSyncId())) {
                            // Since the resource is already present in DB, just update resource
                            Module existingModule = savedModulesGitIdToModuleMap.get(importedModule.getGitSyncId());
                            boolean permissionExists = UserPermissionUtils.validateDomainObjectPermissionExists(
                                    existingModule,
                                    modulePermission.getEditPermission(),
                                    importingMetaDTO.getCurrentUserPermissionGroups());
                            if (!permissionExists) {
                                log.error(
                                        "User does not have permission to edit module with id: {}",
                                        existingModule.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE, existingModule.getId()));
                            }
                            Set<Policy> existingModulePolicy = existingModule.getPolicies();
                            copyNestedNonNullProperties(importedModule, existingModule);
                            // Update branchName
                            existingModule.getDefaultResources().setBranchName(branchName);
                            existingModule.setPolicies(existingModulePolicy);
                            return crudModuleService.save(existingModule);
                        } else {
                            // check if user has permission to add new module to the package
                            boolean permissionExists = UserPermissionUtils.validateDomainObjectPermissionExists(
                                    aPackage,
                                    packagePermission.getModuleCreatePermission(),
                                    importingMetaDTO.getCurrentUserPermissionGroups());
                            if (!permissionExists) {
                                log.error(
                                        "User does not have permission to create module in package with id: {}",
                                        aPackage.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE, aPackage.getId()));
                            }
                            //                        if (aPackage.getGitArtifactMetadata() != null) {
                            // TODO : We do not have git support today, commenting out to retain logic
                            //                            final String defaultArtifactId =
                            //                                aPackage.getGitArtifactMetadata().getDefaultArtifactId();
                            //                            return crudModuleService
                            //                                .findByGitSyncIdAndDefaultApplicationId(
                            //                                    defaultArtifactId, importedModule.getGitSyncId(),
                            // Optional.empty())
                            //                                .switchIfEmpty(Mono.defer(() -> {
                            //                                    // This is the first page we are saving with given
                            // gitSyncId in this
                            //                                    // instance
                            //                                    DefaultResources defaultResources = new
                            // DefaultResources();
                            //                                    defaultResources.setApplicationId(defaultArtifactId);
                            //                                    defaultResources.setBranchName(branchName);
                            //                                    importedModule.setDefaultResources(defaultResources);
                            //                                    return
                            // saveNewPageAndUpdateDefaultResources(importedModule, branchName);
                            //                                }))
                            //                                .flatMap(branchedPage -> {
                            //                                    DefaultResources defaultResources =
                            // branchedPage.getDefaultResources();
                            //                                    // Create new page but keep defaultArtifactId and
                            // defaultPageId same for
                            //                                    // both the
                            //                                    // modules
                            //                                    defaultResources.setBranchName(branchName);
                            //                                    importedModule.setDefaultResources(defaultResources);
                            //                                    importedModule.getUnpublishedModule()
                            //                                        .setDeletedAt(branchedPage
                            //                                            .getUnpublishedModule()
                            //                                            .getDeletedAt());
                            //
                            // importedModule.setDeletedAt(branchedPage.getDeletedAt());
                            //                                    // Set policies from existing branch object
                            //
                            // importedModule.setPolicies(branchedPage.getPolicies());
                            //                                    return newPageService.save(importedModule);
                            //                                });
                            //                        }
                            return saveModuleAndUpdateDefaultResources(importedModule, branchName);
                        }
                    });
                })
                .onErrorResume(error -> {
                    log.error("Error importing module", error);
                    return Mono.error(error);
                });
    }

    private Mono<Module> saveModuleAndUpdateDefaultResources(Module module, String branchName) {
        Module update = new Module();
        return crudModuleService.save(module).flatMap(savedModule -> {
            update.setDefaultResources(
                    DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(savedModule, branchName)
                            .getDefaultResources());
            return crudModuleService.update(savedModule.getId(), update);
        });
    }

    private Map<String, String> updateModulesBeforeMerge(List<Module> existingModules, List<Module> importedModules) {
        Map<String, String> newToOldToModuleNameMap = new HashMap<>(); // maps new names with old names

        // get a list of unpublished module names that already exists
        Set<String> unpublishedModuleNames = existingModules.stream()
                .filter(module -> module.getUnpublishedModule() != null)
                .map(module -> module.getUnpublishedModule().getName())
                .collect(Collectors.toSet());

        // modify each new module
        for (Module module : importedModules) {
            module.setPublishedModule(null); // we'll not merge published module so removing this

            // let's check if module name conflicts, rename in that case
            String oldModuleName = module.getUnpublishedModule().getName(),
                    newModuleName = module.getUnpublishedModule().getName();

            int i = 1;
            while (unpublishedModuleNames.contains(newModuleName)) {
                i++;
                newModuleName = oldModuleName + i;
            }
            module.getUnpublishedModule().setName(newModuleName); // set new name. may be same as before or not
            newToOldToModuleNameMap.put(newModuleName, oldModuleName); // map: new name -> old name
        }
        return newToOldToModuleNameMap;
    }
}
