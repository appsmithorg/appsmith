package com.appsmith.server.moduleinstances.imports;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleInstanceImportableServiceImpl implements ImportableService<ModuleInstance> {

    private final CrudModuleInstanceService crudModuleInstanceService;
    private final PagePermission pagePermission;

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {

        List<ModuleInstance> moduleInstanceList = applicationJson.getModuleInstanceList();

        if (TRUE.equals(importingMetaDTO.getAppendToApp()) || moduleInstanceList == null) {
            // We do not support templates or partial import with module instances
            // Ignore these entities and proceed assuming we never actually get here
            // TODO: Determine if we need to error out here instead.
            return Mono.empty().then();
        }

        // At this point, we are either importing into a fresh app or a git synced app
        return applicationMono.flatMap(importedApplication -> {
            List<Mono<CreateModuleInstanceResponseDTO>> newModuleInstanceMonoList = new ArrayList<>();
            for (ModuleInstance moduleInstance : moduleInstanceList) {
                // If this module instance does not have edit mode configs or a page attached, skip it
                if (moduleInstance.getUnpublishedModuleInstance() == null
                        || !StringUtils.hasLength(
                                moduleInstance.getUnpublishedModuleInstance().getPageId())) {
                    continue;
                }

                NewPage parentPage = new NewPage();
                ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
                ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();

                // If pageId is missing in the moduleInstanceDTO create a fallback pageId
                final String fallbackParentPageId = unpublishedModuleInstance.getPageId();

                if (unpublishedModuleInstance.getName() != null) {
                    validateModuleReference(mappedImportableResourcesDTO, moduleInstance);
                    unpublishedModuleInstance.setId(moduleInstance.getId());
                    unpublishedModuleInstance.setSourceModuleId(moduleInstance.getSourceModuleId());
                    unpublishedModuleInstance.setModuleUUID(moduleInstance.getModuleUUID());
                    parentPage = updatePageInModuleInstance(
                            unpublishedModuleInstance, mappedImportableResourcesDTO.getPageNameMap());
                    unpublishedModuleInstance.setContextId(unpublishedModuleInstance.getPageId());
                }

                if (publishedModuleInstance != null && publishedModuleInstance.getName() != null) {
                    publishedModuleInstance.setId(moduleInstance.getId());
                    if (!StringUtils.hasLength(publishedModuleInstance.getPageId())) {
                        publishedModuleInstance.setPageId(fallbackParentPageId);
                    }
                    NewPage publishedModuleInstancePage = updatePageInModuleInstance(
                            publishedModuleInstance, mappedImportableResourcesDTO.getPageNameMap());
                    parentPage = parentPage == null ? publishedModuleInstancePage : parentPage;
                }

                // check whether user has permission to add new module instance
                if (!UserPermissionUtils.validateDomainObjectPermissionExists(
                        parentPage,
                        pagePermission.getModuleInstanceCreatePermission(),
                        importingMetaDTO.getCurrentUserPermissionGroups())) {
                    log.error(
                            "User does not have permission to create module instance in page with id: {}",
                            parentPage.getId());
                    return Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, parentPage.getId()));
                }

                // set gitSyncId, if it doesn't exist
                if (moduleInstance.getGitSyncId() == null) {
                    unpublishedModuleInstance.setGitSyncId(moduleInstance.getApplicationId() + "_"
                            + Instant.now().toString());
                } else {
                    unpublishedModuleInstance.setGitSyncId(moduleInstance.getGitSyncId());
                }

                // Add it to module instance list that'll be inserted or updated in bulk
                NewPage finalParentPage = parentPage;
                unpublishedModuleInstance.setType(moduleInstance.getType());

                Mono<CreateModuleInstanceResponseDTO> createModuleInstanceMono = createImportedModuleInstance(
                                moduleInstance, importingMetaDTO)
                        .doOnNext(createModuleInstanceResponseDTO -> {
                            ModuleInstanceDTO savedModuleInstance = createModuleInstanceResponseDTO.getModuleInstance();

                            // Update moduleInstanceRef to Id map for composed entities to use
                            Map<String, String> instanceRefToIdMap =
                                    mappedImportableResourcesDTO.getModuleInstanceRefToIdMap();
                            instanceRefToIdMap.put(
                                    finalParentPage.getUnpublishedPage().getName() + "_"
                                            + savedModuleInstance.getName(),
                                    savedModuleInstance.getId());
                        });

                newModuleInstanceMonoList.add(createModuleInstanceMono);
            }

            // Save all the new module instances in bulk
            return Flux.merge(newModuleInstanceMonoList).then();
        });
    }

    /**
     * This method will always generate a new module instance object based on the unpublished object.
     * Make sure to populate the DTO with anything that needs to be part of the domain object as well.
     *
     * @param moduleInstance
     * @param importingMetaDTO
     * @return
     */
    private Mono<CreateModuleInstanceResponseDTO> createImportedModuleInstance(
            ModuleInstance moduleInstance, ImportingMetaDTO importingMetaDTO) {
        ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        if (TRUE.equals(moduleInstanceDTO.getIsValid())) {
            return crudModuleInstanceService.createModuleInstance(moduleInstanceDTO, importingMetaDTO.getBranchName());
        } else {
            return crudModuleInstanceService.createOrphanModuleInstance(
                    moduleInstanceDTO, importingMetaDTO.getBranchName());
        }
    }

    private NewPage updatePageInModuleInstance(ModuleInstanceDTO moduleInstanceDTO, Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(moduleInstanceDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        moduleInstanceDTO.setPageId(parentPage.getId());

        // Update defaultResources in moduleInstanceDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        moduleInstanceDTO.setDefaultResources(defaultResources);

        return parentPage;
    }

    private void validateModuleReference(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, ModuleInstance moduleInstance) {
        Map<String, Module> moduleUUIDToModuleMap = mappedImportableResourcesDTO.getModuleUUIDToModuleMap();
        ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        if (moduleUUIDToModuleMap.containsKey(moduleInstance.getModuleUUID())) {
            moduleInstance.setSourceModuleId(
                    moduleUUIDToModuleMap.get(moduleInstance.getModuleUUID()).getId());
            moduleInstance.setOriginModuleId(
                    moduleUUIDToModuleMap.get(moduleInstance.getModuleUUID()).getOriginModuleId());

            moduleInstanceDTO.setIsValid(true);
        } else {
            ExportableModule exportableModule = mappedImportableResourcesDTO
                    .getModuleUUIDToExportableModuleMap()
                    .get(moduleInstance.getModuleUUID());
            String invalidMessage = String.format(
                    "Module instance does not have a valid module reference in the workspace. Please import module %s from package \"%s\" v%s to fix this issue.",
                    exportableModule.getModuleName(), exportableModule.getPackageName(), exportableModule.getVersion());
            // Make sure that the references to module are reset so that when the module is imported,
            // the next publish on it will update and instantiate this module instance correctly
            // We know this will happen because auto-upgrade checks for matching originModuleId or
            // missing originModuleId but matching moduleUUID
            moduleInstance.setSourceModuleId(null);
            moduleInstance.setOriginModuleId(null);

            Set<String> invalids = moduleInstanceDTO.getInvalids();
            if (invalids == null) {
                invalids = new HashSet<>();
            }
            invalids.add(invalidMessage);
            moduleInstanceDTO.setInvalids(invalids);

            moduleInstanceDTO.setIsValid(false);
        }
    }
}
