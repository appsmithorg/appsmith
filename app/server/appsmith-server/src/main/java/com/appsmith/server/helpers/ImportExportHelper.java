package com.appsmith.server.helpers;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static java.lang.Boolean.TRUE;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static java.lang.Boolean.TRUE;

@Component
public class ImportExportHelper {

    private final ApplicationService applicationService;
    private final CustomJSLibService customJSLibService;
    private final ApplicationPermission applicationPermission;
    private final ActionCollectionRepository actionCollectionRepository;
    private final NewActionRepository newActionRepository;
    private final ActionPermission actionPermission;
    private final DatasourcePermission datasourcePermission;
    private final DatasourceRepository datasourceRepository;
    private final ThemeService themeService;
    private final NewPageRepository newPageRepository;
    private final PagePermission pagePermission;
    private final WorkspaceService workspaceService;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPageService applicationPageService;
    private final DatasourceService datasourceService;
    private final SequenceService sequenceService;

    @Autowired
    public ImportExportHelper(ApplicationService applicationService, CustomJSLibService customJSLibService,
            ApplicationPermission applicationPermission,
            ActionCollectionRepository actionCollectionRepository, NewActionRepository newActionRepository,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission, DatasourceRepository datasourceRepository,
            ThemeService themeService, NewPageRepository newPageRepository,
            PagePermission pagePermission, WorkspaceService workspaceService, WorkspacePermission workspacePermission,
            ApplicationPageService applicationPageService,
            DatasourceService datasourceService, SequenceService sequenceService) {
        this.applicationService = applicationService;
        this.customJSLibService = customJSLibService;
        this.applicationPermission = applicationPermission;
        this.actionCollectionRepository = actionCollectionRepository;
        this.newActionRepository = newActionRepository;
        this.actionPermission = actionPermission;
        this.datasourcePermission = datasourcePermission;
        this.datasourceRepository = datasourceRepository;
        this.themeService = themeService;
        this.newPageRepository = newPageRepository;
        this.pagePermission = pagePermission;
        this.workspaceService = workspaceService;
        this.workspacePermission = workspacePermission;
        this.applicationPageService = applicationPageService;
        this.datasourceService = datasourceService;
        this.sequenceService = sequenceService;
    }

    /**
     * This function will get the template application, if exists, without
     * permission, for the given application id.
     * This is required to fetch template applications without permission.
     * Template application has exportWithConfiguration set to true.
     * 
     * @param applicationId application id
     * @return Mono of Application object
     */
    public Mono<Application> fetchApplication(String applicationId) {
        return applicationService.findByIdAndExportWithConfiguration(applicationId, TRUE)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION,
                                applicationId)));
    }

    /**
     * This function will find Application object from the given applicationId and
     * objective.
     * 
     * @param applicationId application id
     * @param serialiseFor  objective of serialisation
     * @return
     */
    public Mono<Application> fetchApplication(String applicationId, boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        Optional<AclPermission> permission = applicationPermission.getAccessPermissionForImportExport(isExport,
                serialiseFor);
        // TODO should handle a case where this function returns empty?
        return applicationService.findById(applicationId, permission.get())
                // Find the application without permissions if it is a template application
                .switchIfEmpty(Mono.defer(
                        () -> fetchApplication(applicationId)))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID,
                                applicationId)));
    }

    /**
     * This function gets all custom JS libs for export
     * 
     * @param applicationId ID of the application
     * @return Flux of CustomJSLib
     */
    public Flux<CustomJSLib> getAllCustomJSLibsForApplication(String applicationId) {
        return customJSLibService.getAllJSLibsInApplication(applicationId, null, false)
                .map(unpublishedCustomJSLibList -> {
                    /**
                     * Previously it was a Set and as Set is an unordered collection of elements
                     * that
                     * resulted in uncommitted changes. Making it a list and sorting it by the
                     * UidString
                     * ensure that the order will be maintained. And this solves the issue.
                     */
                    Collections.sort(unpublishedCustomJSLibList, Comparator.comparing(CustomJSLib::getUidString));
                    return unpublishedCustomJSLibList;
                })
                .flatMapMany(Flux::fromIterable);
    }

    /**
     * This function gets all action collections for export
     * 
     * @param pageIds list of page ids
     * @param serialiseFor objective of serialisation
     * @return Flux of ActionCollection
     */
    public Flux<ActionCollection> fetchCollectionsForApplication(List<String> pageIds, boolean isExport,
                                                                 SerialiseApplicationObjective serialiseFor) {
        Optional<AclPermission> optionalPermission = actionPermission.getAccessPermissionForImportExport(isExport,
                serialiseFor);
        return actionCollectionRepository.findByListOfPageIds(pageIds, optionalPermission);
    }

    public Mono<Workspace> fetchWorkspace(String workspaceId, boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        return workspaceService
                .findById(workspaceId, workspacePermission.getAccessPermissionForImportExport(true, serialiseFor))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));
    }

    /**
     * This function gets all actions for export
     * 
     * @param pageIds  List of page ids for which actions are to be fetched
     * @param serialiseFor objective of serialisation
     * @return Flux of NewAction
     */
    public Flux<NewAction> fetchActionsForApplication(List<String> pageIds, boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        Optional<AclPermission> optionalPermission = actionPermission.getAccessPermissionForImportExport(isExport,
                serialiseFor);
        return newActionRepository.findByListOfPageIds(pageIds, optionalPermission);
    }

    /**
     * This function returns a set of Datasources for a given workspace
     * 
     * @param workspaceId  workspace id
     * @param serialiseFor objective of serialisation
     * @return Flux of Datasource
     */
    public Flux<Datasource> fetchDatasourcesForWorkspace(String workspaceId, boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        Optional<AclPermission> optionalPermission = datasourcePermission.getAccessPermissionForImportExport(isExport,
                serialiseFor);
        return datasourceRepository.findAllByWorkspaceId(workspaceId, optionalPermission);
    }

    /**
     * This function returns edit mode theme for the given application, if not found
     * then returns default theme
     * 
     * @param application application object
     * @return Mono of Theme
     */
    public Mono<Theme> getApplicationEditModeThemeOrDefault(Application application) {
        return themeService.getThemeById(application.getEditModeThemeId(), READ_THEMES)
                .switchIfEmpty(Mono.defer(() -> themeService.getDefaultTheme()))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.THEME, "default")));
    }

    /**
     * This function returns published mode theme for the given application, if not
     * found then returns default theme
     * 
     * @param application application object
     * @return Mono of Theme
     */
    public Mono<Theme> getAplicationPublishedThemeOrDefault(Application application) {
        return themeService.getThemeById(application.getPublishedModeThemeId(), READ_THEMES)
                .switchIfEmpty(Mono.defer(() -> themeService.getDefaultTheme()))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.THEME, "default")));
    }

    /**
     * This function exports all the pages of the given application
     * 
     * @param pageIds list of page ids
     * @param serialiseFor objective of serialisation
     * @return Flux of NewPage
     */
    public Flux<NewPage> fetchPagesForApplication(List<String> pageIds, boolean isExport,
            SerialiseApplicationObjective serialiseFor) {

        Optional<AclPermission> optionalPermission = pagePermission.getAccessPermissionForImportExport(isExport,
                serialiseFor);
        return newPageRepository.findByIds(pageIds, optionalPermission);
    }

    public Mono<Application> fetchOrCreateApplicationForImport(String applicationId, String explicitApplicationId, Application applicationToImport,
            SerialiseApplicationObjective serialiseFor) {

        Mono<Application> applicationMono = applicationService.findById(applicationId,
                    applicationPermission.getAccessPermissionForImportExport(false, serialiseFor));

        applicationMono = applicationMono.switchIfEmpty(Mono.defer(() -> {
            // If application id is not present, then create a new application
            //applicationToImport.setPages(applicationPages);
            applicationToImport.setExplicitId(explicitApplicationId);
            return applicationPageService.createOrUpdateSuffixedApplication(applicationToImport,
                    applicationToImport.getName(), 0);
        }));

        return applicationMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND,
                        FieldName.APPLICATION_ID, applicationId)));
    }

    /**
     * This will check if the datasource is already present in the workspace and
     * create a new one if unable to find one
     *
     * @param existingDatasourceFlux already present datasource in the workspace
     * @param datasource             which will be checked against existing
     *                               datasources
     * @param workspaceId            workspace where duplicate datasource should be
     *                               checked
     * @return already present or brand new datasource depending upon the equality
     *         check
     */
    public Mono<Datasource> createUniqueDatasourceIfNotPresent(Flux<Datasource> existingDatasourceFlux,
            Datasource datasource,
            String workspaceId) {
        /*
         * 1. If same datasource is present return
         * 2. If unable to find the datasource create a new datasource with unique name
         * and return
         */
        final DatasourceConfiguration datasourceConfig = datasource.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            copyNestedNonNullProperties(
                    datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            datasourceConfig.getAuthentication().setAuthenticationResponse(null);
            datasourceConfig.getAuthentication().setAuthenticationType(null);
        }

        return existingDatasourceFlux
                // For git import exclude datasource configuration
                .filter(ds -> ds.getName().equals(datasource.getName())
                        && datasource.getPluginId().equals(ds.getPluginId()))
                .next() // Get the first matching datasource, we don't need more than one here.
                .switchIfEmpty(Mono.defer(() -> {
                    if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                        datasourceConfig.getAuthentication().setAuthenticationResponse(authResponse);
                    }
                    // No matching existing datasource found, so create a new one.
                    datasource
                            .setIsConfigured(datasourceConfig != null && datasourceConfig.getAuthentication() != null);
                    return datasourceService
                            .findByNameAndWorkspaceId(datasource.getName(), workspaceId,
                                    datasourcePermission.getEditPermission())
                            .flatMap(duplicateNameDatasource -> getUniqueSuffixForDuplicateNameEntity(
                                    duplicateNameDatasource, workspaceId))
                            .map(suffix -> {
                                datasource.setName(datasource.getName() + suffix);
                                return datasource;
                            })
                            .then(datasourceService.create(datasource));
                }));
    }

    /**
     * This function will respond with unique suffixed number for the entity to
     * avoid duplicate names
     *
     * @param sourceEntity for which the suffixed number is required to avoid
     *                     duplication
     * @param workspaceId  workspace in which entity should be searched
     * @return next possible number in case of duplication
     */
    public Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String workspaceId) {
        if (sourceEntity != null) {
            return sequenceService
                    .getNextAsSuffix(sourceEntity.getClass(), " for workspace with _id : " + workspaceId)
                    .map(sequenceNumber -> {
                        // sequence number will be empty if no duplicate is found
                        return sequenceNumber.isEmpty() ? " #1" : " #" + sequenceNumber.trim();
                    });
        }
        return Mono.just("");
    }

    public Mono<Workspace> fetchWorkspace(String workspaceId, SerialiseApplicationObjective serializeFor) {
        return workspaceService
                .findById(workspaceId, workspacePermission.getAccessPermissionForImportExport(false, serializeFor))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));
    }
}