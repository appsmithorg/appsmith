package com.appsmith.server.applications.imports;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportServiceCE;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.ImportExportUtils.setPropertiesToExistingApplication;
import static com.appsmith.server.helpers.ImportExportUtils.setPublishedApplicationProperties;

@RequiredArgsConstructor
@Slf4j
@Service
public class ApplicationImportServiceCEImpl
        implements ArtifactBasedImportServiceCE<Application, ApplicationImportDTO, ApplicationJson> {

    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;
    private final UpdateLayoutService updateLayoutService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final ImportableService<Theme> themeImportableService;
    private final ImportableService<NewPage> newPageImportableService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;

    /**
     * This map keeps constants which are specific to context of Application, parallel to other Artifacts.
     * i.e. Artifact --> Application
     * i.e. ID --> applicationId
     */
    protected final Map<String, String> applicationConstantsMap =
            Map.of(FieldName.ARTIFACT_CONTEXT, FieldName.APPLICATION, FieldName.ID, FieldName.APPLICATION_ID);

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForImportingArtifact(
            Set<String> userPermissionGroups) {
        return ImportArtifactPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getApplicationCreatePermission())
                .permissionRequiredToCreateDatasource(true)
                .permissionRequiredToEditDatasource(true)
                .currentUserPermissionGroups(userPermissionGroups)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForUpdatingArtifact(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(applicationPermission.getEditPermission())
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
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetArtifact(applicationPermission.getEditPermission())
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForRestoringSnapshot(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(applicationPermission.getEditPermission())
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    @Override
    public ImportArtifactPermissionProvider getImportArtifactPermissionProviderForMergingJsonWithArtifact(
            Set<String> userPermissions) {
        return ImportArtifactPermissionProvider.builder(
                        applicationPermission,
                        pagePermission,
                        actionPermission,
                        datasourcePermission,
                        workspacePermission)
                .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                .requiredPermissionOnTargetArtifact(applicationPermission.getEditPermission())
                .allPermissionsRequired()
                .currentUserPermissionGroups(userPermissions)
                .build();
    }

    /**
     * this method removes the application name from Json file as updating the app-name is not supported via import
     * this avoids name conflict during import flow within workspace
     *
     * @param applicationId : ID of the application which has been saved.
     * @param artifactExchangeJson : the ArtifactExchangeJSON which is getting imported
     */
    @Override
    public void setJsonArtifactNameToNullBeforeUpdate(String applicationId, ArtifactExchangeJson artifactExchangeJson) {
        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        if (StringUtils.hasText(applicationId) && (applicationJson).getExportedApplication() != null) {
            applicationJson.getExportedApplication().setName(null);
            applicationJson.getExportedApplication().setSlug(null);
        }
    }

    protected List<Mono<Void>> getPageDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {

        // Requires pageNameMap, pageNameToOldNameMap, pluginMap and datasourceNameToIdMap to be present in importable
        // resources.
        // Updates actionResultDTO in importable resources.
        // Also, directly updates required information in DB
        Mono<Void> importedNewActionsMono = newActionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        // Requires pageNameMap, pageNameToOldNameMap, pluginMap and actionResultDTO to be present in importable
        // resources.
        // Updates actionCollectionResultDTO in importable resources.
        // Also, directly updates required information in DB
        Mono<Void> importedActionCollectionsMono = actionCollectionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> combinedActionImportablesMono = importedNewActionsMono.then(importedActionCollectionsMono);
        return List.of(combinedActionImportablesMono);
    }

    @Override
    public ApplicationImportDTO getImportableArtifactDTO(
            Artifact importableArtifact, List<Datasource> datasourceList, String environmentId) {
        Application application = (Application) importableArtifact;
        ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
        applicationImportDTO.setApplication(application);

        Boolean isUnConfiguredDatasource = datasourceList.stream().anyMatch(datasource -> {
            DatasourceStorageDTO datasourceStorageDTO =
                    datasource.getDatasourceStorages().get(environmentId);
            if (datasourceStorageDTO == null) {
                // If this environment has not been configured,
                // We do not expect to find a storage, user will have to reconfigure
                return Boolean.FALSE;
            }
            return Boolean.FALSE.equals(datasourceStorageDTO.getIsConfigured());
        });

        if (Boolean.TRUE.equals(isUnConfiguredDatasource)) {
            applicationImportDTO.setIsPartialImport(true);
            applicationImportDTO.setUnConfiguredDatasourceList(datasourceList);
        } else {
            applicationImportDTO.setIsPartialImport(false);
        }

        return applicationImportDTO;
    }

    @Override
    public void updateArtifactExchangeJsonWithEntitiesToBeConsumed(
            ArtifactExchangeJson artifactExchangeJson, List<String> entitiesToImport) {

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

        // Update the application JSON to prepare it for merging inside an existing application
        if (applicationJson.getExportedApplication() != null) {
            // setting some properties to null so that target application is not updated by these properties
            applicationJson.getExportedApplication().setName(null);
            applicationJson.getExportedApplication().setSlug(null);
            applicationJson.getExportedApplication().setForkingEnabled(null);
            applicationJson.getExportedApplication().setForkWithConfiguration(null);
            applicationJson.getExportedApplication().setClonedFromApplicationId(null);
            applicationJson.getExportedApplication().setExportWithConfiguration(null);
        }

        // need to remove git sync id. Also filter pages if pageToImport is not empty
        if (applicationJson.getPageList() != null) {
            List<ApplicationPage> applicationPageList =
                    new ArrayList<>(applicationJson.getPageList().size());
            List<String> pageNames =
                    new ArrayList<>(applicationJson.getPageList().size());
            List<NewPage> importedNewPageList = applicationJson.getPageList().stream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null
                            && (CollectionUtils.isEmpty(entitiesToImport)
                                    || entitiesToImport.contains(
                                            newPage.getUnpublishedPage().getName())))
                    .peek(newPage -> {
                        ApplicationPage applicationPage = new ApplicationPage();
                        applicationPage.setId(newPage.getUnpublishedPage().getName());
                        applicationPage.setIsDefault(false);
                        applicationPageList.add(applicationPage);
                        pageNames.add(applicationPage.getId());
                    })
                    .peek(newPage -> newPage.setGitSyncId(null))
                    .collect(Collectors.toList());
            applicationJson.setPageList(importedNewPageList);
            // Remove the pages from the exported Application inside the json based on the pagesToImport
            applicationJson.getExportedApplication().setPages(applicationPageList);
            applicationJson.getExportedApplication().setPublishedPages(applicationPageList);
        }
        if (applicationJson.getActionList() != null) {
            List<NewAction> importedNewActionList = applicationJson.getActionList().stream()
                    .filter(newAction -> newAction.getUnpublishedAction() != null
                            && (CollectionUtils.isEmpty(entitiesToImport)
                                    || entitiesToImport.contains(
                                            newAction.getUnpublishedAction().getPageId())))
                    .peek(newAction ->
                            newAction.setGitSyncId(null)) // setting this null so that this action can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionList(importedNewActionList);
        }
        if (applicationJson.getActionCollectionList() != null) {
            List<ActionCollection> importedActionCollectionList = applicationJson.getActionCollectionList().stream()
                    .filter(actionCollection -> (CollectionUtils.isEmpty(entitiesToImport)
                            || entitiesToImport.contains(
                                    actionCollection.getUnpublishedCollection().getPageId())))
                    .peek(actionCollection -> actionCollection.setGitSyncId(
                            null)) // setting this null so that this action collection can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionCollectionList(importedActionCollectionList);
        }

        if (applicationJson.getCustomJSLibList() != null) {
            List<CustomJSLib> importedCustomJSLibList =
                    applicationJson.getCustomJSLibList().stream().collect(Collectors.toList());
            applicationJson.setCustomJSLibList(importedCustomJSLibList);
        }
    }

    @Override
    public void syncClientAndSchemaVersion(ArtifactExchangeJson artifactExchangeJson) {
        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        Application importedApplication = applicationJson.getExportedApplication();
        importedApplication.setServerSchemaVersion(applicationJson.getServerSchemaVersion());
        importedApplication.setClientSchemaVersion(applicationJson.getClientSchemaVersion());
    }

    @Override
    public Mono<Void> generateArtifactSpecificImportableEntities(
            ArtifactExchangeJson artifactExchangeJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        // Persists relevant information and updates mapped resources
        return customJSLibImportableService.importEntities(
                importingMetaDTO, mappedImportableResourcesDTO, null, null, (ApplicationJson) artifactExchangeJson);
    }

    @Override
    public Mono<Boolean> isArtifactConnectedToGit(String artifactId) {
        return applicationService.isApplicationConnectedToGit(artifactId);
    }

    @Override
    public Mono<Application> updateAndSaveArtifactInContext(
            Artifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<User> currentUserMono) {
        Mono<Application> importApplicationMono = Mono.just((Application) importableArtifact)
                .map(application -> {
                    if (application.getApplicationVersion() == null) {
                        application.setApplicationVersion(ApplicationVersion.EARLIEST_VERSION);
                    }
                    application.setViewMode(false);
                    application.setForkWithConfiguration(null);
                    application.setExportWithConfiguration(null);
                    application.setWorkspaceId(importingMetaDTO.getWorkspaceId());
                    application.setIsPublic(null);
                    application.setPolicies(null);
                    Map<String, List<ApplicationPage>> mapOfApplicationPageList = Map.of(
                            FieldName.PUBLISHED,
                            application.getPublishedPages(),
                            FieldName.UNPUBLISHED,
                            application.getPages());
                    mappedImportableResourcesDTO
                            .getResourceStoreFromArtifactExchangeJson()
                            .putAll(mapOfApplicationPageList);
                    application.setPages(null);
                    application.setPublishedPages(null);
                    return application;
                })
                .map(application -> {
                    application.setUnpublishedCustomJSLibs(
                            new HashSet<>(mappedImportableResourcesDTO.getInstalledJsLibsList()));
                    return application;
                });

        importApplicationMono = importApplicationMono.zipWith(currentUserMono).map(objects -> {
            Application application = objects.getT1();
            application.setModifiedBy(objects.getT2().getUsername());
            return application;
        });

        if (!StringUtils.hasText(importingMetaDTO.getArtifactId())) {
            importApplicationMono = importApplicationMono.flatMap(application -> {
                return applicationPageService.createOrUpdateSuffixedApplication(application, application.getName(), 0);
            });
        } else {
            Mono<Application> existingApplicationMono = applicationService
                    .findById(
                            importingMetaDTO.getArtifactId(),
                            importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication())
                    .switchIfEmpty(Mono.defer(() -> {
                        log.error(
                                "No application found with id: {} and permission: {}",
                                importingMetaDTO.getArtifactId(),
                                importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.APPLICATION,
                                importingMetaDTO.getArtifactId()));
                    }))
                    .cache();

            // this can be a git sync, import page from template, update app with json, restore snapshot
            if (importingMetaDTO.getAppendToArtifact()) { // we don't need to do anything with the imported application
                if (!CollectionUtils.isEmpty(mappedImportableResourcesDTO.getInstalledJsLibsList())) {
                    Application update = new Application();
                    update.setUnpublishedCustomJSLibs(
                            new HashSet<>(mappedImportableResourcesDTO.getInstalledJsLibsList()));
                    importApplicationMono = applicationService
                            .update(importingMetaDTO.getArtifactId(), update)
                            .then(existingApplicationMono);
                } else {
                    importApplicationMono = existingApplicationMono;
                }
            } else {
                importApplicationMono = importApplicationMono
                        .zipWith(existingApplicationMono)
                        .map(objects -> {
                            Application newApplication = objects.getT1();
                            Application existingApplication = objects.getT2();
                            // This method sets the published mode properties in the imported
                            // application.When a user imports an application from the git repo,
                            // since the git only stores the unpublished version, the current
                            // deployed version in the newly imported app is not updated.
                            // This function sets the initial deployed version to the same as the
                            // edit mode one.
                            setPublishedApplicationProperties(newApplication);
                            setPropertiesToExistingApplication(newApplication, existingApplication);
                            return existingApplication;
                        })
                        .flatMap(application -> {
                            Mono<Application> parentApplicationMono;
                            if (application.getGitApplicationMetadata() != null) {
                                parentApplicationMono = applicationService.findById(
                                        application.getGitApplicationMetadata().getDefaultArtifactId());
                            } else {
                                parentApplicationMono = Mono.just(application);
                            }
                            return Mono.zip(Mono.just(application), parentApplicationMono);
                        })
                        .flatMap(objects -> {
                            Application application = objects.getT1();
                            Application parentApplication = objects.getT2();
                            application.setPolicies(parentApplication.getPolicies());
                            return applicationService
                                    .save(application)
                                    .onErrorResume(DuplicateKeyException.class, error -> {
                                        if (error.getMessage() != null) {
                                            return applicationPageService.createOrUpdateSuffixedApplication(
                                                    application, application.getName(), 0);
                                        }
                                        throw error;
                                    });
                        });
            }
        }
        return importApplicationMono
                .doOnNext(application -> {
                    if (application.getGitArtifactMetadata() != null) {
                        importingMetaDTO.setBranchName(
                                application.getGitArtifactMetadata().getBranchName());
                    }
                })
                .elapsed()
                .map(tuples -> {
                    log.debug("time to create or update application object: {}", tuples.getT1());
                    return tuples.getT2();
                })
                .onErrorResume(error -> {
                    log.error("Error while creating or updating application object", error);
                    return Mono.error(error);
                });
    }

    @Override
    public Mono<Application> updateImportableArtifact(Artifact importableArtifact) {
        return Mono.just((Application) importableArtifact)
                .flatMap(application -> {
                    log.info("Imported application with id {}", application.getId());
                    // Need to update the application object with updated pages and publishedPages
                    Application updateApplication = new Application();
                    updateApplication.setPages(application.getPages());
                    updateApplication.setPublishedPages(application.getPublishedPages());

                    return applicationService.update(application.getId(), updateApplication);
                })
                .flatMap(application -> {
                    return Flux.fromIterable(application.getPages())
                            .map(ApplicationPage::getId)
                            .flatMap(pageId -> {
                                return updateLayoutService
                                        .updatePageLayoutsByPageId(pageId)
                                        .onErrorResume(throwable -> {
                                            // the error would most probably arise because of update layout error,
                                            // this shouldn't stop the application from getting imported.
                                            String errorMessage = ImportExportUtils.getErrorMessage(throwable);
                                            log.error(
                                                    "Error while updating layout. Error: {}", errorMessage, throwable);
                                            // continuing the execution
                                            return Mono.just("");
                                        });
                            })
                            .collectList()
                            .thenReturn(application);
                });
    }

    @Override
    public Mono<Application> updateImportableEntities(
            Artifact importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        return Mono.just((Application) importableContext).flatMap(application -> {
            return newActionImportableService
                    .updateImportedEntities(application, importingMetaDTO, mappedImportableResourcesDTO)
                    .then(newPageImportableService.updateImportedEntities(
                            application, importingMetaDTO, mappedImportableResourcesDTO))
                    .thenReturn(application);
        });
    }

    @Override
    public Map<String, Object> createImportAnalyticsData(
            ArtifactExchangeJson artifactExchangeJson, Artifact importableArtifact) {

        Application application = (Application) importableArtifact;
        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

        int jsObjectCount = CollectionUtils.isEmpty(applicationJson.getActionCollectionList())
                ? 0
                : applicationJson.getActionCollectionList().size();
        int actionCount = CollectionUtils.isEmpty(applicationJson.getActionList())
                ? 0
                : applicationJson.getActionList().size();

        return Map.of(
                FieldName.APPLICATION_ID,
                application.getId(),
                FieldName.WORKSPACE_ID,
                application.getWorkspaceId(),
                "pageCount",
                applicationJson.getPageList().size(),
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
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return importableArtifactMono.flatMapMany(importableContext -> {
            Application application = (Application) importableContext;
            ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

            // Updates pageNametoIdMap and pageNameMap in importable resources.
            // Also, directly updates required information in DB
            Mono<Void> importedPagesMono = newPageImportableService.importEntities(
                    importingMetaDTO,
                    mappedImportableResourcesDTO,
                    workspaceMono,
                    Mono.just(application),
                    applicationJson);

            // Directly updates required theme information in DB
            Mono<Void> importedThemesMono = themeImportableService.importEntities(
                    importingMetaDTO,
                    mappedImportableResourcesDTO,
                    workspaceMono,
                    Mono.just(application),
                    applicationJson,
                    true);

            return Flux.merge(List.of(importedPagesMono, importedThemesMono));
        });
    }

    @Override
    public Flux<Void> generateArtifactContextDependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        return importableArtifactMono.flatMapMany(importableArtifact -> {
            Application application = (Application) importableArtifact;
            ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;

            List<Mono<Void>> pageDependentImportables = getPageDependentImportables(
                    importingMetaDTO,
                    mappedImportableResourcesDTO,
                    workspaceMono,
                    Mono.just(application),
                    applicationJson);

            return Flux.merge(pageDependentImportables);
        });
    }

    @Override
    public String validateArtifactSpecificFields(ArtifactExchangeJson artifactExchangeJson) {
        ApplicationJson importedDoc = (ApplicationJson) artifactExchangeJson;
        String errorField = "";
        if (CollectionUtils.isEmpty(importedDoc.getPageList())) {
            errorField = FieldName.PAGE_LIST;
        } else if (importedDoc.getActionList() == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDoc.getDatasourceList() == null) {
            errorField = FieldName.DATASOURCE;
        }

        return errorField;
    }

    @Override
    public Map<String, String> getArtifactSpecificConstantsMap() {
        return applicationConstantsMap;
    }

    @Override
    public Mono<Set<String>> getDatasourceIdSetConsumedInArtifact(String baseArtifactId) {
        return newActionService
                .findAllByApplicationIdAndViewMode(baseArtifactId, false, Optional.empty(), Optional.empty())
                .filter(newAction -> StringUtils.hasText(
                        newAction.getUnpublishedAction().getDatasource().getId()))
                .mapNotNull(newAction ->
                        newAction.getUnpublishedAction().getDatasource().getId())
                .collect(Collectors.toSet());
    }

    @Override
    public Flux<String> getBranchedArtifactIdsByBranchedArtifactId(String branchedArtifactId) {
        return applicationService.findAllBranchedApplicationIdsByBranchedApplicationId(branchedArtifactId, null);
    }
}
