package com.appsmith.server.imports.internal.partial;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.BuildingBlockDTO;
import com.appsmith.server.dtos.BuildingBlockImportDTO;
import com.appsmith.server.dtos.BuildingBlockResponseDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.DryOperationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationTemplateService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.widgets.refactors.WidgetRefactorUtil;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;

@RequiredArgsConstructor
@Slf4j
public class PartialImportServiceCEImpl implements PartialImportServiceCE {

    private final ImportService importService;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final AnalyticsService analyticsService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final SessionUserService sessionUserService;
    private final TransactionalOperator transactionalOperator;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ImportableService<Plugin> pluginImportableService;
    private final ImportableService<NewPage> newPageImportableService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;
    private final NewPageService newPageService;
    private final RefactoringService refactoringService;
    private final ApplicationTemplateService applicationTemplateService;
    private final WidgetRefactorUtil widgetRefactorUtil;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;
    private final ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson>
            applicationImportService;
    private final DatasourceService datasourceService;
    private final CustomJSLibService customJSLibService;
    private final UpdateLayoutService updateLayoutService;
    private final DryOperationRepository dryOperationRepository;

    @Override
    public Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, Part file) {
        return importService
                .readFilePartToString(file)
                .flatMap(fileContents ->
                        importResourceInPage(workspaceId, applicationId, pageId, branchName, fileContents));
    }

    @Override
    public Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, String fileContents) {
        Mono<User> currUserMono = sessionUserService.getCurrentUser();
        return importService
                .extractArtifactExchangeJson(fileContents)
                .flatMap(artifactExchangeJson -> {
                    if (artifactExchangeJson instanceof ApplicationJson
                            && isImportableResource((ApplicationJson) artifactExchangeJson)) {
                        return importResourceInPage(
                                        workspaceId, applicationId, pageId, (ApplicationJson) artifactExchangeJson)
                                .zipWith(currUserMono);
                    } else {
                        return Mono.error(
                                new AppsmithException(
                                        AppsmithError.GENERIC_JSON_IMPORT_ERROR,
                                        "The file is not compatible with the current partial import operation. Please check the file and try again."));
                    }
                })
                .flatMap(tuple -> {
                    final BuildingBlockImportDTO buildingBlockImportDTO = tuple.getT1();
                    final User user = tuple.getT2();
                    final Map<String, Object> eventData =
                            Map.of(FieldName.APPLICATION, buildingBlockImportDTO.getApplication());
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, applicationId,
                            FieldName.WORKSPACE_ID,
                                    buildingBlockImportDTO.getApplication().getWorkspaceId(),
                            FieldName.EVENT_DATA, eventData);

                    return analyticsService
                            .sendEvent(AnalyticsEvents.PARTIAL_IMPORT.getEventName(), user.getUsername(), data)
                            .thenReturn(buildingBlockImportDTO.getApplication());
                });
    }

    private boolean isImportableResource(ApplicationJson artifactExchangeJson) {
        return artifactExchangeJson.getExportedApplication() == null
                && artifactExchangeJson.getPageList() == null
                && artifactExchangeJson.getModifiedResources() == null;
    }

    private Mono<BuildingBlockImportDTO> importResourceInPage(
            String workspaceId, String branchedApplicationId, String branchedPageId, ApplicationJson applicationJson) {
        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();

        // Extract file and get App Json
        Mono<Application> partiallyImportedAppMono = getImportApplicationPermissions()
                .flatMap(permissionProvider -> {
                    // Set Application in App JSON, remove the pages other than the one to be imported in
                    // Set the current page in the JSON to be imported
                    // Debug and get the value from getImportApplicationMono method if any difference
                    // Modify the Application set in JSON to be imported

                    Mono<Workspace> workspaceMono = workspaceService
                            .findById(workspaceId, permissionProvider.getRequiredPermissionOnTargetWorkspace())
                            .switchIfEmpty(Mono.defer(() -> {
                                log.error(
                                        "No workspace found with id: {} and permission: {}",
                                        workspaceId,
                                        permissionProvider.getRequiredPermissionOnTargetWorkspace());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId));
                            }))
                            .cache();

                    ImportingMetaDTO importingMetaDTO = new ImportingMetaDTO(
                            workspaceId,
                            FieldName.APPLICATION,
                            branchedApplicationId,
                            null,
                            null,
                            new ArrayList<>(),
                            false,
                            true,
                            permissionProvider,
                            null);

                    // Get the Application from DB
                    Mono<Application> importedApplicationMono = applicationService
                            .findById(
                                    branchedApplicationId,
                                    permissionProvider.getRequiredPermissionOnTargetApplication())
                            .cache();

                    // Get a list of all branched application ids that will be used to find existing synced entities for
                    // all branch aware resources getting imported
                    Mono<List<String>> branchedArtifactIdsMono = applicationImportService
                            .getBranchedArtifactIdsByBranchedArtifactId(branchedApplicationId)
                            .collectList()
                            .doOnNext(importingMetaDTO::setBranchedArtifactIds);

                    return newPageService
                            .findById(branchedPageId, AclPermission.MANAGE_PAGES)
                            .flatMap(page -> {
                                importingMetaDTO.setRefType(page.getRefType());
                                importingMetaDTO.setRefName(page.getRefName());
                                Layout layout =
                                        page.getUnpublishedPage().getLayouts().get(0);
                                return refactoringService.getAllExistingEntitiesMono(
                                        page.getId(), CreatorContextType.PAGE, layout.getId(), true);
                            })
                            .flatMap(nameSet -> {
                                // Fetch name of the existing resources in the page to avoid name clashing
                                Map<String, String> nameMap =
                                        nameSet.stream().collect(Collectors.toMap(name -> name, name -> name));
                                mappedImportableResourcesDTO.setRefactoringNameReference(nameMap);
                                return importedApplicationMono;
                            })
                            .flatMap(application -> {
                                applicationJson.setExportedApplication(application);
                                return Mono.just(applicationJson);
                            })
                            .then(branchedArtifactIdsMono)
                            // Import Custom Js Lib and Datasource
                            .then(getApplicationImportableEntities(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    workspaceMono,
                                    importedApplicationMono,
                                    applicationJson))
                            .thenReturn("done")
                            // Update the pageName map for actions and action collection
                            .then(pageNameMapForActionAndActionCollectionInAppJson(
                                    branchedPageId, applicationJson, mappedImportableResourcesDTO))
                            .thenReturn("done")
                            // Import Actions and action collection
                            .then(getActionAndActionCollectionImport(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    workspaceMono,
                                    importedApplicationMono,
                                    applicationJson))
                            .thenReturn("done")
                            .flatMap(result -> {
                                Application application = applicationJson.getExportedApplication();
                                // Keep existing JS Libs and add the imported ones
                                application
                                        .getUnpublishedCustomJSLibs()
                                        .addAll(new HashSet<>(mappedImportableResourcesDTO.getInstalledJsLibsList()));
                                if (mappedImportableResourcesDTO.getActionResultDTO() == null) {
                                    return applicationService.update(application.getId(), application);
                                }
                                return newActionImportableService
                                        .updateImportedEntities(
                                                application, importingMetaDTO, mappedImportableResourcesDTO)
                                        .then(newPageImportableService.updateImportedEntities(
                                                application, importingMetaDTO, mappedImportableResourcesDTO))
                                        .thenReturn(application);
                            });
                })
                // execute dry run ops
                .flatMap(importableArtifact -> dryOperationRepository
                        .executeAllDbOps(mappedImportableResourcesDTO)
                        .thenReturn(importableArtifact))
                .flatMap(application -> {
                    Map<String, Object> fieldNameValueMap = Map.of(
                            FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS,
                            application.getUnpublishedCustomJSLibs());
                    return applicationService
                            .updateByBranchedIdAndFieldsMap(branchedApplicationId, fieldNameValueMap)
                            .then(Mono.just(application));
                })
                // Update the refactored names of the actions and action collections in the DSL bindings
                .flatMap(application -> {
                    // Partial export can have no pages
                    if (applicationJson.getPageList() == null) {
                        return Mono.just(application);
                    }
                    Stopwatch processStopwatch1 = new Stopwatch("Refactoring the widget in DSL ");
                    // The building block is stored as a page in an application
                    final JsonNode dsl = widgetRefactorUtil.convertDslStringToJsonNode(applicationJson
                            .getPageList()
                            .get(0)
                            .getUnpublishedPage()
                            .getLayouts()
                            .get(0)
                            .getDsl());
                    return Flux.fromIterable(mappedImportableResourcesDTO
                                    .getRefactoringNameReference()
                                    .keySet())
                            .filter(name -> !name.equals(mappedImportableResourcesDTO
                                    .getRefactoringNameReference()
                                    .get(name)))
                            .flatMap(name -> {
                                String refactoredName = mappedImportableResourcesDTO
                                        .getRefactoringNameReference()
                                        .get(name);
                                return widgetRefactorUtil.refactorNameInDsl(
                                        dsl,
                                        name,
                                        refactoredName,
                                        applicationPageService.getEvaluationVersion(),
                                        Pattern.compile(name));
                            })
                            .collectList()
                            .flatMap(refactoredDsl -> {
                                processStopwatch1.stopAndLogTimeInMillis();
                                applicationJson.setWidgets(dsl.toString());
                                return Mono.just(application);
                            });
                })
                .as(transactionalOperator::transactional);

        return partiallyImportedAppMono.map(application -> {
            BuildingBlockImportDTO buildingBlockImportDTO = new BuildingBlockImportDTO();
            buildingBlockImportDTO.setApplication(application);
            buildingBlockImportDTO.setWidgetDsl(applicationJson.getWidgets());
            buildingBlockImportDTO.setRefactoredEntityNameMap(
                    mappedImportableResourcesDTO.getRefactoringNameReference());
            return buildingBlockImportDTO;
        });
    }

    private Mono<ImportArtifactPermissionProvider> getImportApplicationPermissions() {
        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportArtifactPermissionProvider permissionProvider = ImportArtifactPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetArtifact(applicationPermission.getEditPermission())
                    .permissionRequiredToCreateDatasource(true)
                    .permissionRequiredToEditDatasource(true)
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return Mono.just(permissionProvider);
        });
    }

    private Mono<Void> getApplicationImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {
        Mono<Void> pluginMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                true);

        Mono<Void> datasourceMono = datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                true);

        Mono<Void> customJsLibMono = customJSLibImportableService.importEntities(
                importingMetaDTO, mappedImportableResourcesDTO, null, null, applicationJson);

        return pluginMono.then(datasourceMono).then(customJsLibMono).then();
    }

    private Mono<Void> getActionAndActionCollectionImport(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {
        Mono<Void> actionMono = newActionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        Mono<Void> actionCollectionMono = actionCollectionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        return actionMono.then(actionCollectionMono).then();
    }

    private Mono<String> pageNameMapForActionAndActionCollectionInAppJson(
            String pageId, ApplicationJson applicationJson, MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        return newPageService.findById(pageId, null).flatMap(newPage -> {
            String pageName = newPage.getUnpublishedPage().getName();
            // update page name reference with newPage
            Map<String, NewPage> pageNameMap = new HashMap<>();
            pageNameMap.put(pageName, newPage);
            mappedImportableResourcesDTO.setContextMap(pageNameMap);

            if (applicationJson.getActionList() == null) {
                return Mono.just(pageName);
            }

            applicationJson.getActionList().forEach(action -> {
                action.getPublishedAction().setPageId(pageName);
                action.getUnpublishedAction().setPageId(pageName);
                if (action.getPublishedAction().getCollectionId() != null) {
                    String collectionName =
                            action.getPublishedAction().getCollectionId().split("_")[1];
                    action.getPublishedAction().setCollectionId(pageName + "_" + collectionName);
                    action.getUnpublishedAction().setCollectionId(pageName + "_" + collectionName);
                }

                String actionName = action.getId().split("_")[1];
                action.setId(pageName + "_" + actionName);
                action.setGitSyncId(null);
            });

            if (applicationJson.getActionCollectionList() == null) {
                return Mono.just(pageName);
            }
            applicationJson.getActionCollectionList().forEach(actionCollection -> {
                actionCollection.getUnpublishedCollection().setPageId(pageName);
                if (actionCollection.getPublishedCollection() != null) {
                    actionCollection.getPublishedCollection().setPageId(pageName);
                }
                String collectionName = actionCollection.getId().split("_")[1];
                actionCollection.setId(pageName + "_" + collectionName);
                actionCollection.setGitSyncId(null);
            });
            return Mono.just(pageName);
        });
    }

    @Override
    public Mono<BuildingBlockResponseDTO> importBuildingBlock(BuildingBlockDTO buildingBlockDTO) {
        Mono<ApplicationJson> applicationJsonMono =
                applicationTemplateService.getApplicationJsonFromTemplate(buildingBlockDTO.getTemplateId());

        Stopwatch processStopwatch = new Stopwatch("Download Content from Cloud service");
        return applicationJsonMono.flatMap(applicationJson -> {
            return this.importResourceInPage(
                            buildingBlockDTO.getWorkspaceId(),
                            buildingBlockDTO.getApplicationId(),
                            buildingBlockDTO.getPageId(),
                            applicationJson)
                    .flatMap(buildingBlockImportDTO -> {
                        String branchedPageId = buildingBlockDTO.getPageId();
                        processStopwatch.stopAndLogTimeInMillis();
                        // Fetch layout and get new onPageLoadActions
                        // This data is not present in a client, since these are created
                        // after importing the block
                        BuildingBlockResponseDTO buildingBlockResponseDTO = new BuildingBlockResponseDTO();
                        buildingBlockResponseDTO.setWidgetDsl(buildingBlockImportDTO.getWidgetDsl());
                        buildingBlockResponseDTO.setOnPageLoadActions(new ArrayList<>());

                        // Fetch the datasource and customJsLibs
                        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                        params.add(WORKSPACE_ID, buildingBlockDTO.getWorkspaceId());
                        Mono<List<Datasource>> datasourceList =
                                datasourceService.getAllWithStorages(params).collectList();

                        Mono<List<CustomJSLib>> customJSLibs = customJSLibService.getAllJSLibsInContext(
                                buildingBlockDTO.getApplicationId(), CreatorContextType.APPLICATION, false);

                        Mono<List<ActionDTO>> actionList = newActionService
                                .getUnpublishedActionsByPageId(branchedPageId, AclPermission.MANAGE_ACTIONS)
                                .collectList();

                        MultiValueMap<String, String> params1 = new LinkedMultiValueMap<>();
                        params1.add(FieldName.PAGE_ID, branchedPageId);

                        List<String> newActionNames = applicationJson.getActionList().stream()
                                .map(newAction ->
                                        newAction.getUnpublishedAction().getName())
                                .toList();

                        return newPageService
                                .findById(buildingBlockDTO.getPageId(), AclPermission.MANAGE_PAGES)
                                .flatMap(newPage -> {
                                    String layoutId = newPage.getUnpublishedPage()
                                            .getLayouts()
                                            .get(0)
                                            .getId();
                                    Layout layout = applicationJson
                                            .getPageList()
                                            .get(0)
                                            .getUnpublishedPage()
                                            .getLayouts()
                                            .get(0);
                                    layout.setDsl(widgetRefactorUtil.convertDslStringToJSONObject(
                                            buildingBlockImportDTO.getWidgetDsl()));
                                    // fetch the layout and get the onPageLoadActions
                                    return updateLayoutService
                                            .getOnPageLoadActions(
                                                    buildingBlockDTO.getPageId(),
                                                    layoutId,
                                                    layout,
                                                    buildingBlockImportDTO
                                                            .getApplication()
                                                            .getEvaluationVersion(),
                                                    CreatorContextType.PAGE)
                                            .flatMap(layoutDTO -> {
                                                layoutDTO.forEach(actionSet -> {
                                                    buildingBlockResponseDTO
                                                            .getOnPageLoadActions()
                                                            .addAll(actionSet.stream()
                                                                    .toList());
                                                });

                                                return Mono.zip(datasourceList, customJSLibs, actionList);
                                            })
                                            .map(tuple3 -> {
                                                buildingBlockResponseDTO.setDatasourceList(tuple3.getT1());
                                                buildingBlockResponseDTO.setCustomJSLibList(tuple3.getT2());
                                                buildingBlockResponseDTO.setNewActionList(tuple3.getT3());
                                                return buildingBlockResponseDTO;
                                            });
                                })
                                // Remove the existing actions in the page from the newActions list
                                .flatMap(buildingBlockResponseDTO1 -> {
                                    buildingBlockResponseDTO1
                                            .getNewActionList()
                                            .removeIf(actionDTO -> !newActionNames.contains(actionDTO.getName()));
                                    return Mono.just(buildingBlockResponseDTO1);
                                });
                    });
        });
    }
}
