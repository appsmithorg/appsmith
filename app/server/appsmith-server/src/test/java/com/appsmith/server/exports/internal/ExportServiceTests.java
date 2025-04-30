package com.appsmith.server.exports.internal;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static com.appsmith.server.dtos.CustomJSLibContextDTO.getDTOFromCustomJSLib;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

@Slf4j
@SpringBootTest
@DirtiesContext
@TestMethodOrder(MethodOrderer.MethodName.class)
public class ExportServiceTests {

    private static final String INVALID_JSON_FILE = "invalid json file";
    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedPlugin;
    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;
    private static String exportWithConfigurationAppId;

    @Autowired
    ExportService exportService;

    @Autowired
    ImportService importService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (Boolean.TRUE.equals(isSetupDone)) {
            return;
        }
        User currentUser = sessionUserService.getCurrentUser().block();
        Set<String> beforeCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingWorkspace);
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        Workspace workspace = new Workspace();
        workspace.setName("Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
        Set<String> afterCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User after creating workspace: {}", afterCreatingWorkspace);

        log.info("Workspace ID: {}", workspaceId);
        log.info("Workspace Role Ids: {}", workspace.getDefaultPermissionGroups());
        log.info("Policy for created Workspace: {}", workspace.getPolicies());
        log.info("Current User ID: {}", currentUser.getId());

        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());

        Application.ThemeSetting themeSettings = getThemeSetting();
        testApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
        testApplication.getUnpublishedApplicationDetail().setThemeSetting(themeSettings);

        Application savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        testAppId = savedApplication.getId();

        Datasource ds1 = new Datasource();
        ds1.setName("DS1");
        ds1.setWorkspaceId(workspaceId);
        ds1.setPluginId(installedPlugin.getId());
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://example.org/get");
        datasourceConfiguration.setHeaders(List.of(new Property("X-Answer", "42")));

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        ds1.setDatasourceStorages(storages1);

        Datasource ds2 = new Datasource();
        ds2.setName("DS2");
        ds2.setPluginId(installedPlugin.getId());
        ds2.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration2 = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        datasourceConfiguration2.setAuthentication(auth);
        HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
        storages2.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration2));
        ds2.setDatasourceStorages(storages2);

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS datasource");
        jsDatasource.setWorkspaceId(workspaceId);
        installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());

        ds1 = datasourceService.create(ds1).block();
        ds2 = datasourceService.create(ds2).block();
        datasourceMap.put("DS1", ds1);
        datasourceMap.put("DS2", ds2);
        isSetupDone = true;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationWithNullApplicationIdTest() {
        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(null, "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportPublicApplicationTest() {

        Application application = new Application();
        application.setName("exportPublicApplicationTest-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        // Make the application public
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .block();

        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(createdApplication.getId(), "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication).isNotNull();
                    // Assert that the exported application is NOT public
                    assertThat(exportedApplication.getPolicies()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplication_withInvalidApplicationId_throwNoResourceFoundException() {
        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName("invalidAppId", "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.APPLICATION_ID, "invalidAppId")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenContainsInternalFields_InternalFieldsNotExported() {
        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(testAppId, "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication.getModifiedBy()).isNull();
                    assertThat(exportedApplication.getLastUpdateTime()).isNull();
                    assertThat(exportedApplication.getLastEditedAt()).isNull();
                    assertThat(exportedApplication.getLastDeployedAt()).isNull();
                    assertThat(exportedApplication.getGitApplicationMetadata()).isNull();
                    assertThat(exportedApplication.getEditModeThemeId()).isNull();
                    assertThat(exportedApplication.getPublishedModeThemeId()).isNull();
                    assertThat(exportedApplication.getExportWithConfiguration()).isNull();
                    assertThat(exportedApplication.getForkWithConfiguration()).isNull();
                    assertThat(exportedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithDatasourceButWithoutActionsTest() {

        Application testApplication = new Application();
        testApplication.setName("Another Export Application");

        final Mono<ApplicationJson> resultMono = workspaceService
                .getById(workspaceId)
                .flatMap(workspace -> {
                    final Datasource ds1 = datasourceMap.get("DS1");
                    ds1.setWorkspaceId(workspace.getId());

                    final Datasource ds2 = datasourceMap.get("DS2");
                    ds2.setWorkspaceId(workspace.getId());

                    return applicationPageService.createApplication(testApplication, workspaceId);
                })
                .flatMap(application -> exportService.exportByArtifactIdAndBranchName(
                        application.getId(), "", ArtifactType.APPLICATION))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getPageList()).hasSize(1);
                    assertThat(applicationJson.getActionList()).isEmpty();
                    assertThat(applicationJson.getDatasourceList()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithActionAndActionCollectionTest() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("ApplicationWithActionCollectionAndDatasource");
        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        assert testApplication != null;
        final String appName = testApplication.getName();
        final Mono<ApplicationJson> resultMono = Mono.zip(
                        Mono.just(testApplication),
                        newPageService.findPageById(
                                testApplication.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    Layout layout = testPage.getLayouts().get(0);
                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject dsl = new JSONObject();
                    try {
                        dsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                    }

                    ArrayList children = (ArrayList) dsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ validAction.data }}");
                    children.add(testWidget);

                    JSONObject tableWidget = new JSONObject();
                    tableWidget.put("widgetName", "Table1");
                    tableWidget.put("type", "TABLE_WIDGET");
                    Map<String, Object> primaryColumns = new HashMap<>();
                    JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
                    primaryColumns.put("_id", "{{ PageAction.data }}");
                    primaryColumns.put("_class", jsonObject);
                    tableWidget.put("primaryColumns", primaryColumns);
                    final ArrayList<Object> objects = new ArrayList<>();
                    JSONArray temp2 = new JSONArray();
                    temp2.add(new JSONObject(Map.of("key", "primaryColumns._id")));
                    tableWidget.put("dynamicBindingPathList", temp2);
                    children.add(tableWidget);

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(testPage.getId());
                    action.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS2"));

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("validAction2");
                    action2.setPageId(testPage.getId());
                    action2.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    action2.setUserSetOnLoad(true);
                    ActionConfiguration actionConfiguration2 = new ActionConfiguration();
                    actionConfiguration2.setHttpMethod(HttpMethod.GET);
                    action2.setActionConfiguration(actionConfiguration2);
                    action2.setDatasource(datasourceMap.get("DS2"));

                    ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
                    actionCollectionDTO1.setName("testCollection1");
                    actionCollectionDTO1.setPageId(testPage.getId());
                    actionCollectionDTO1.setApplicationId(testApp.getId());
                    actionCollectionDTO1.setWorkspaceId(testApp.getWorkspaceId());
                    actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("testAction1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO1.setActions(List.of(action1));
                    actionCollectionDTO1.setPluginType(PluginType.JS);

                    return layoutCollectionService
                            .createCollection(actionCollectionDTO1)
                            .then(layoutActionService.createSingleAction(action, Boolean.FALSE))
                            .then(layoutActionService.createSingleAction(action2, Boolean.FALSE))
                            .then(updateLayoutService.updateLayout(
                                    testPage.getId(), testPage.getApplicationId(), layout.getId(), layout))
                            .then(exportService.exportByArtifactIdAndBranchName(
                                    testApp.getId(), "", ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                })
                .cache();

        Mono<List<NewAction>> actionListMono = resultMono.then(newActionService
                .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null)
                .collectList());

        Mono<List<ActionCollection>> collectionListMono = resultMono.then(actionCollectionService
                .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null)
                .collectList());

        Mono<List<NewPage>> pageListMono = resultMono.then(newPageService
                .findNewPagesByApplicationId(testApplication.getId(), READ_PAGES)
                .collectList());

        StepVerifier.create(Mono.zip(resultMono, actionListMono, collectionListMono, pageListMono))
                .assertNext(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    List<NewAction> DBActions = tuple.getT2();
                    List<ActionCollection> DBCollections = tuple.getT3();
                    List<NewPage> DBPages = tuple.getT4();

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<ActionCollection> actionCollectionList = applicationJson.getActionCollectionList();
                    List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList();

                    List<String> exportedCollectionIds = actionCollectionList.stream()
                            .map(ActionCollection::getId)
                            .collect(Collectors.toList());
                    List<String> exportedActionIds =
                            actionList.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBCollectionIds =
                            DBCollections.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> DBActionIds =
                            DBActions.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBOnLayoutLoadActionIds = new ArrayList<>();
                    List<String> exportedOnLayoutLoadActionIds = new ArrayList<>();

                    assertThat(DBPages).hasSize(1);
                    DBPages.forEach(
                            newPage -> newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(
                                                actionDTO -> DBOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            }));
                    pageList.forEach(
                            newPage -> newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(
                                                actionDTO -> exportedOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            }));

                    NewPage defaultPage = pageList.get(0);

                    // Check if the mongo escaped widget names are carried to exported file from DB
                    Layout pageLayout =
                            DBPages.get(0).getUnpublishedPage().getLayouts().get(0);
                    Set<String> mongoEscapedWidgets = pageLayout.getMongoEscapedWidgetNames();
                    Set<String> expectedMongoEscapedWidgets = Set.of("Table1");
                    assertThat(mongoEscapedWidgets).isEqualTo(expectedMongoEscapedWidgets);

                    pageLayout =
                            pageList.get(0).getUnpublishedPage().getLayouts().get(0);
                    Set<String> exportedMongoEscapedWidgets = pageLayout.getMongoEscapedWidgetNames();
                    assertThat(exportedMongoEscapedWidgets).isEqualTo(expectedMongoEscapedWidgets);

                    assertThat(exportedApp.getName()).isEqualTo(appName);
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    assertThat(exportedApp.getPages().get(0).getId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage
                                    .getUnpublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getDsl())
                            .isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isNull();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream()
                            .filter(action -> action.getId().equals("Page1_validAction"))
                            .findFirst()
                            .get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getWorkspaceId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    ActionDTO unpublishedAction = validAction.getUnpublishedAction();
                    assertThat(unpublishedAction.getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(unpublishedAction.getDatasource().getPluginId())
                            .isEqualTo(installedPlugin.getPackageName());

                    NewAction testAction1 = actionList.stream()
                            .filter(action ->
                                    action.getUnpublishedAction().getName().equals("testAction1"))
                            .findFirst()
                            .get();
                    assertThat(testAction1.getId()).isEqualTo("Page1_testCollection1.testAction1");

                    assertThat(actionCollectionList.isEmpty()).isFalse();
                    assertThat(actionCollectionList).hasSize(1);
                    final ActionCollection actionCollection = actionCollectionList.get(0);
                    assertThat(actionCollection.getApplicationId()).isNull();
                    assertThat(actionCollection.getWorkspaceId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType())
                            .isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId())
                            .isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    DatasourceStorage datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNotNull();
                    assertThat(datasource.getDatasourceConfiguration().getAuthentication())
                            .isNull();
                    assertThat(datasource.getDatasourceConfiguration().getSshProxy())
                            .isNull();
                    assertThat(datasource.getDatasourceConfiguration().getSshProxyEnabled())
                            .isNull();
                    assertThat(datasource.getDatasourceConfiguration().getProperties())
                            .isNull();

                    assertThat(applicationJson.getInvisibleActionFields()).isNull();
                    NewAction validAction2 = actionList.stream()
                            .filter(action -> action.getId().equals("Page1_validAction2"))
                            .findFirst()
                            .get();
                    assertEquals(true, validAction2.getUnpublishedAction().getUserSetOnLoad());

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets())
                            .isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets())
                            .isNull();
                    assertThat(applicationJson.getEditModeTheme()).isNotNull();
                    assertThat(applicationJson.getEditModeTheme().isSystemTheme())
                            .isTrue();
                    assertThat(applicationJson.getEditModeTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(applicationJson.getPublishedTheme()).isNotNull();
                    assertThat(applicationJson.getPublishedTheme().isSystemTheme())
                            .isTrue();
                    assertThat(applicationJson.getPublishedTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(exportedCollectionIds).isNotEmpty();
                    assertThat(exportedCollectionIds).doesNotContain(String.valueOf(DBCollectionIds));

                    assertThat(exportedActionIds).isNotEmpty();
                    assertThat(exportedActionIds).doesNotContain(String.valueOf(DBActionIds));

                    assertThat(exportedOnLayoutLoadActionIds).isNotEmpty();
                    assertThat(exportedOnLayoutLoadActionIds).doesNotContain(String.valueOf(DBOnLayoutLoadActionIds));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonForGitTest() {

        StringBuilder pageName = new StringBuilder();
        final Mono<ApplicationJson> resultMono = applicationRepository
                .findById(testAppId)
                .flatMap(testApp -> {
                    final String pageId = testApp.getPages().get(0).getId();
                    return Mono.zip(Mono.just(testApp), newPageService.findPageById(pageId, READ_PAGES, false));
                })
                .flatMap(tuple -> {
                    Datasource ds1 = datasourceMap.get("DS1");
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();
                    pageName.append(testPage.getName());

                    Layout layout = testPage.getLayouts().get(0);
                    JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(testPage.getId());
                    action.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(ds1);

                    return layoutActionService
                            .createAction(action)
                            .then(exportService.exportByArtifactId(
                                    testApp.getId(),
                                    SerialiseArtifactObjective.VERSION_CONTROL,
                                    ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList();

                    NewPage newPage = pageList.get(0);

                    assertThat(applicationJson.getServerSchemaVersion())
                            .isEqualTo(jsonSchemaVersions.getServerVersion());
                    assertThat(applicationJson.getClientSchemaVersion())
                            .isEqualTo(jsonSchemaVersions.getClientVersion());

                    assertThat(exportedApp.getName()).isNotNull();
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    assertThat(exportedApp.getPages().get(0).getId()).isEqualTo(pageName.toString());
                    assertThat(exportedApp.getGitApplicationMetadata()).isNull();

                    assertThat(exportedApp.getApplicationDetail()).isNotNull();
                    assertThat(exportedApp.getApplicationDetail().getThemeSetting())
                            .isNotNull();
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getSizing())
                            .isNotNull();
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getAccentColor())
                            .isEqualTo("#FFFFFF");
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getColorMode())
                            .isEqualTo(Application.ThemeSetting.Type.LIGHT);
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getDensity())
                            .isEqualTo(1);
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getFontFamily())
                            .isEqualTo("#000000");
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getSizing())
                            .isEqualTo(1);
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getIconStyle())
                            .isEqualTo(Application.ThemeSetting.IconStyle.OUTLINED);
                    assertThat(exportedApp
                                    .getApplicationDetail()
                                    .getThemeSetting()
                                    .getAppMaxWidth())
                            .isEqualTo(Application.ThemeSetting.AppMaxWidth.LARGE);

                    assertThat(exportedApp.getPolicies()).isNull();
                    assertThat(exportedApp.getUserPermissions()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(newPage.getApplicationId()).isNull();
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl())
                            .isNotNull();
                    assertThat(newPage.getId()).isNull();
                    assertThat(newPage.getPolicies()).isNull();

                    assertThat(actionList.isEmpty()).isFalse();
                    NewAction validAction = actionList.get(0);
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getWorkspaceId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    assertThat(validAction.getUnpublishedAction().getPageId())
                            .isEqualTo(newPage.getUnpublishedPage().getName());

                    assertThat(datasourceList).hasSize(1);
                    DatasourceStorage datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNull();
                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets())
                            .isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportImportApplication_importWithBranchName_updateApplicationResourcesWithBranch() {
        Application testApplication = new Application();
        testApplication.setName("Export-Import-Update-Branch_Test-App");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("testBranch");
        testApplication.setGitApplicationMetadata(gitData);

        Application savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Mono<Application> result = newPageService
                .findNewPagesByApplicationId(savedApplication.getId(), READ_PAGES)
                .collectList()
                .flatMap(newPages -> {
                    NewPage newPage = newPages.get(0);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(newPage.getId());
                    action.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS1"));
                    return layoutActionService
                            .createAction(action)
                            .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS));
                })
                .then(exportService
                        .exportByArtifactId(
                                savedApplication.getId(),
                                SerialiseArtifactObjective.VERSION_CONTROL,
                                ArtifactType.APPLICATION)
                        .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                        .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                                workspaceId, savedApplication.getId(), applicationJson, gitData.getRefName())))
                .map(importableArtifact -> (Application) importableArtifact)
                .cache();

        Mono<List<NewPage>> updatedPagesMono = result.then(newPageService
                .findNewPagesByApplicationId(savedApplication.getId(), READ_PAGES)
                .collectList());

        Mono<List<NewAction>> updatedActionsMono = result.then(newActionService
                .findAllByApplicationIdAndViewMode(savedApplication.getId(), false, READ_PAGES, null)
                .collectList());

        StepVerifier.create(Mono.zip(result, updatedPagesMono, updatedActionsMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();

                    final String branchName =
                            application.getGitApplicationMetadata().getRefName();
                    pageList.forEach(page -> {
                        assertThat(page.getBranchName()).isEqualTo(branchName);
                    });

                    actionList.forEach(action -> {
                        assertThat(action.getBranchName()).isEqualTo(branchName);
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importUpdatedApplicationIntoWorkspaceFromFile_publicApplication_visibilityFlagNotReset() {
        // Create a application and make it public
        // Now add a page and export the same import it to the app
        // Check if the policies and visibility flag are not reset

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();

        Application testApplication = new Application();
        testApplication.setName(
                "importUpdatedApplicationIntoWorkspaceFromFile_publicApplication_visibilityFlagNotReset");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Application newApplication = applicationService
                .changeViewAccessForAllBranchesByBranchedApplicationId(application.getId(), applicationAccessDTO)
                .block();

        PermissionGroup anonymousPermissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(),
                        developerPermissionGroup.getId(),
                        viewerPermissionGroup.getId(),
                        anonymousPermissionGroup.getId()))
                .build();

        Mono<Application> applicationMono = exportService
                .exportByArtifactIdAndBranchName(application.getId(), "master", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                        workspaceId, application.getId(), applicationJson, "master"))
                .map(importableArtifact -> (Application) importableArtifact);

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getIsPublic()).isEqualTo(Boolean.TRUE);
                    assertThat(application1.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                })
                .verifyComplete();
    }

    @NotNull private static Application.ThemeSetting getThemeSetting() {
        Application.ThemeSetting themeSettings = new Application.ThemeSetting();
        themeSettings.setSizing(1);
        themeSettings.setDensity(1);
        themeSettings.setBorderRadius("#000000");
        themeSettings.setAccentColor("#FFFFFF");
        themeSettings.setFontFamily("#000000");
        themeSettings.setColorMode(Application.ThemeSetting.Type.LIGHT);
        themeSettings.setIconStyle(Application.ThemeSetting.IconStyle.OUTLINED);
        themeSettings.setAppMaxWidth(Application.ThemeSetting.AppMaxWidth.LARGE);
        return themeSettings;
    }

    /**
     * Testcase to check if the application is exported with the datasource configuration object if this setting is
     * enabled from application object
     * This can be enabled with exportWithConfiguration: true
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplication_withDatasourceConfig_exportedWithDecryptedFields() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportApplication_withCredentialsForSampleApps_SuccessWithDecryptFields");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        assert testApplication != null;
        exportWithConfigurationAppId = testApplication.getId();
        ApplicationAccessDTO accessDTO = new ApplicationAccessDTO();
        accessDTO.setPublicAccess(true);
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(exportWithConfigurationAppId, accessDTO)
                .block();
        final String appName = testApplication.getName();
        final Mono<ApplicationJson> resultMono = Mono.zip(
                        Mono.just(testApplication),
                        newPageService.findPageById(
                                testApplication.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    Layout layout = testPage.getLayouts().get(0);
                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject dsl = new JSONObject();
                    try {
                        dsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                        fail();
                    }

                    ArrayList children = (ArrayList) dsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ validAction.data }}");
                    children.add(testWidget);

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(testPage.getId());
                    action.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS2"));

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("validAction2");
                    action2.setPageId(testPage.getId());
                    action2.setRunBehaviour(RunBehaviourEnum.ON_PAGE_LOAD);
                    action2.setUserSetOnLoad(true);
                    ActionConfiguration actionConfiguration2 = new ActionConfiguration();
                    actionConfiguration2.setHttpMethod(HttpMethod.GET);
                    action2.setActionConfiguration(actionConfiguration2);
                    action2.setDatasource(datasourceMap.get("DS2"));

                    ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
                    actionCollectionDTO1.setName("testCollection1");
                    actionCollectionDTO1.setPageId(testPage.getId());
                    actionCollectionDTO1.setApplicationId(testApp.getId());
                    actionCollectionDTO1.setWorkspaceId(testApp.getWorkspaceId());
                    actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("testAction1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO1.setActions(List.of(action1));
                    actionCollectionDTO1.setPluginType(PluginType.JS);

                    return layoutCollectionService
                            .createCollection(actionCollectionDTO1)
                            .then(layoutActionService.createSingleAction(action, Boolean.FALSE))
                            .then(layoutActionService.createSingleAction(action2, Boolean.FALSE))
                            .then(updateLayoutService.updateLayout(
                                    testPage.getId(), testPage.getApplicationId(), layout.getId(), layout))
                            .then(exportService.exportByArtifactIdAndBranchName(
                                    testApp.getId(), "", ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                })
                .cache();

        Mono<List<NewAction>> actionListMono = resultMono.then(newActionService
                .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null)
                .collectList());

        Mono<List<ActionCollection>> collectionListMono = resultMono.then(actionCollectionService
                .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null)
                .collectList());

        Mono<List<NewPage>> pageListMono = resultMono.then(newPageService
                .findNewPagesByApplicationId(testApplication.getId(), READ_PAGES)
                .collectList());

        StepVerifier.create(Mono.zip(resultMono, actionListMono, collectionListMono, pageListMono))
                .assertNext(tuple -> {
                    ApplicationJson applicationJson = tuple.getT1();
                    List<NewAction> DBActions = tuple.getT2();
                    List<ActionCollection> DBCollections = tuple.getT3();
                    List<NewPage> DBPages = tuple.getT4();

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<ActionCollection> actionCollectionList = applicationJson.getActionCollectionList();
                    List<DatasourceStorage> datasourceList = applicationJson.getDatasourceList();

                    List<String> exportedCollectionIds = actionCollectionList.stream()
                            .map(ActionCollection::getId)
                            .collect(Collectors.toList());
                    List<String> exportedActionIds =
                            actionList.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBCollectionIds =
                            DBCollections.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> DBActionIds =
                            DBActions.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBOnLayoutLoadActionIds = new ArrayList<>();
                    List<String> exportedOnLayoutLoadActionIds = new ArrayList<>();

                    DBPages.forEach(
                            newPage -> newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(
                                                actionDTO -> DBOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            }));

                    pageList.forEach(
                            newPage -> newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(
                                                actionDTO -> exportedOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            }));

                    NewPage defaultPage = pageList.get(0);

                    assertThat(exportedApp.getName()).isEqualTo(appName);
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    ApplicationPage page = exportedApp.getPages().get(0);

                    assertThat(page.getId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(page.getIsDefault()).isTrue();
                    assertThat(page.getDefaultPageId()).isNull();

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage
                                    .getUnpublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getDsl())
                            .isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isNull();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream()
                            .filter(action -> action.getId().equals("Page1_validAction"))
                            .findFirst()
                            .get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getWorkspaceId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    ActionDTO unpublishedAction = validAction.getUnpublishedAction();
                    assertThat(unpublishedAction.getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(unpublishedAction.getDatasource().getPluginId())
                            .isEqualTo(installedPlugin.getPackageName());

                    NewAction testAction1 = actionList.stream()
                            .filter(action ->
                                    action.getUnpublishedAction().getName().equals("testAction1"))
                            .findFirst()
                            .get();
                    assertThat(testAction1.getId()).isEqualTo("Page1_testCollection1.testAction1");

                    assertThat(actionCollectionList.isEmpty()).isFalse();
                    assertThat(actionCollectionList).hasSize(1);
                    final ActionCollection actionCollection = actionCollectionList.get(0);
                    assertThat(actionCollection.getApplicationId()).isNull();
                    assertThat(actionCollection.getWorkspaceId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType())
                            .isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId())
                            .isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    DatasourceStorage datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNotNull();

                    final Map<String, InvisibleActionFields> invisibleActionFields =
                            applicationJson.getInvisibleActionFields();

                    assertThat(invisibleActionFields).isNull();
                    for (NewAction newAction : actionList) {
                        if (newAction.getId().equals("Page1_validAction2")) {
                            assertEquals(true, newAction.getUnpublishedAction().getUserSetOnLoad());
                        } else {
                            assertEquals(false, newAction.getUnpublishedAction().getUserSetOnLoad());
                        }
                    }

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets())
                            .isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets())
                            .isNull();
                    assertThat(applicationJson.getEditModeTheme()).isNotNull();
                    assertThat(applicationJson.getEditModeTheme().isSystemTheme())
                            .isTrue();
                    assertThat(applicationJson.getEditModeTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(applicationJson.getPublishedTheme()).isNotNull();
                    assertThat(applicationJson.getPublishedTheme().isSystemTheme())
                            .isTrue();
                    assertThat(applicationJson.getPublishedTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(exportedCollectionIds).isNotEmpty();
                    assertThat(exportedCollectionIds).doesNotContain(String.valueOf(DBCollectionIds));

                    assertThat(exportedActionIds).isNotEmpty();
                    assertThat(exportedActionIds).doesNotContain(String.valueOf(DBActionIds));

                    assertThat(exportedOnLayoutLoadActionIds).isNotEmpty();
                    assertThat(exportedOnLayoutLoadActionIds).doesNotContain(String.valueOf(DBOnLayoutLoadActionIds));

                    assertThat(applicationJson.getDecryptedFields()).isNotNull();
                })
                .verifyComplete();
    }

    /**
     * Test to check if the application can be exported with read only access if this is sample application
     */
    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void exportApplication_withReadOnlyAccess_exportedWithDecryptedFields() {
        Mono<ApplicationJson> exportApplicationMono = exportService
                .exportByArtifactId(
                        exportWithConfigurationAppId, SerialiseArtifactObjective.SHARE, ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(exportApplicationMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getExportedApplication()).isNotNull();
                    assertThat(applicationJson.getDecryptedFields()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            exportAndImportApplication_withMultiplePagesOrderSameInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName(
                "exportAndImportApplication_withMultiplePagesOrderSameInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        assert testApplication != null;

        PageDTO testPage1 = new PageDTO();
        testPage1.setName("testPage1");
        testPage1.setApplicationId(testApplication.getId());
        testPage1 = applicationPageService.createPage(testPage1).block();

        PageDTO testPage2 = new PageDTO();
        testPage2.setName("testPage2");
        testPage2.setApplicationId(testApplication.getId());
        testPage2 = applicationPageService.createPage(testPage2).block();

        // Set order for the newly created pages
        applicationPageService
                .reorderPage(testApplication.getId(), testPage1.getId(), 0)
                .block();
        applicationPageService
                .reorderPage(testApplication.getId(), testPage2.getId(), 1)
                .block();
        // Deploy the current application
        applicationPageService.publish(testApplication.getId(), true).block();

        Mono<ApplicationJson> applicationJsonMono = exportService
                .exportByArtifactIdAndBranchName(testApplication.getId(), "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .cache();

        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getPageOrder()).isNull();
                    assertThat(applicationJson.getPublishedPageOrder()).isNull();
                    List<String> pageList = applicationJson.getExportedApplication().getPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    assertThat(pageList.get(0)).isEqualTo("testPage1");
                    assertThat(pageList.get(1)).isEqualTo("testPage2");
                    assertThat(pageList.get(2)).isEqualTo("Page1");

                    List<String> publishedPageList =
                            applicationJson.getExportedApplication().getPublishedPages().stream()
                                    .map(ApplicationPage::getId)
                                    .collect(Collectors.toList());

                    assertThat(publishedPageList.get(0)).isEqualTo("testPage1");
                    assertThat(publishedPageList.get(1)).isEqualTo("testPage2");
                    assertThat(publishedPageList.get(2)).isEqualTo("Page1");
                })
                .verifyComplete();

        ApplicationJson applicationJson = applicationJsonMono.block();
        Application application = importService
                .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        // Get the unpublished pages and verify the order
        List<ApplicationPage> pageDTOS = application.getPages();
        Mono<NewPage> newPageMono1 = newPageService.findById(pageDTOS.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono2 = newPageService.findById(pageDTOS.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono3 = newPageService.findById(pageDTOS.get(2).getId(), MANAGE_PAGES);

        StepVerifier.create(Mono.zip(newPageMono1, newPageMono2, newPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getUnpublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage2.getUnpublishedPage().getName()).isEqualTo("testPage2");
                    assertThat(newPage3.getUnpublishedPage().getName()).isEqualTo("Page1");

                    assertThat(newPage1.getId()).isEqualTo(pageDTOS.get(0).getId());
                    assertThat(newPage2.getId()).isEqualTo(pageDTOS.get(1).getId());
                    assertThat(newPage3.getId()).isEqualTo(pageDTOS.get(2).getId());
                })
                .verifyComplete();

        // Get the published pages
        List<ApplicationPage> publishedPageDTOs = application.getPublishedPages();
        Mono<NewPage> newPublishedPageMono1 =
                newPageService.findById(publishedPageDTOs.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono2 =
                newPageService.findById(publishedPageDTOs.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono3 =
                newPageService.findById(publishedPageDTOs.get(2).getId(), MANAGE_PAGES);

        StepVerifier.create(Mono.zip(newPublishedPageMono1, newPublishedPageMono2, newPublishedPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getPublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("testPage2");
                    assertThat(newPage3.getPublishedPage().getName()).isEqualTo("Page1");

                    assertThat(newPage1.getId())
                            .isEqualTo(publishedPageDTOs.get(0).getId());
                    assertThat(newPage2.getId())
                            .isEqualTo(publishedPageDTOs.get(1).getId());
                    assertThat(newPage3.getId())
                            .isEqualTo(publishedPageDTOs.get(2).getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            importApplicationInWorkspaceFromGit_WithNavSettingsInEditMode_ImportedAppHasNavSettingsInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("import-with-navSettings-in-editMode");

        Application testApplication = new Application();
        testApplication.setName(
                "importApplicationInWorkspaceFromGit_WithNavSettingsInEditMode_ImportedAppHasNavSettingsInEditAndViewMode");
        Application.NavigationSetting appNavigationSetting = new Application.NavigationSetting();
        appNavigationSetting.setOrientation("top");
        testApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
        testApplication.getUnpublishedApplicationDetail().setNavigationSetting(appNavigationSetting);
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("testBranch");
        testApplication.setGitApplicationMetadata(gitData);
        Application savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Mono<Application> result = exportService
                .exportByArtifactId(
                        savedApplication.getId(), SerialiseArtifactObjective.VERSION_CONTROL, ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .flatMap(applicationJson -> {
                    // setting published mode resource as null, similar to the app json exported to git repo
                    applicationJson.getExportedApplication().setPublishedApplicationDetail(null);
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    workspaceId, savedApplication.getId(), applicationJson, gitData.getRefName())
                            .map(importableArtifact -> (Application) importableArtifact);
                });

        StepVerifier.create(result)
                .assertNext(importedApp -> {
                    assertThat(importedApp.getUnpublishedApplicationDetail()).isNotNull();
                    assertThat(importedApp.getPublishedApplicationDetail()).isNotNull();
                    assertThat(importedApp.getUnpublishedApplicationDetail().getNavigationSetting())
                            .isNotNull();
                    assertEquals(
                            importedApp
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation(),
                            "top");
                    assertThat(importedApp.getPublishedApplicationDetail().getNavigationSetting())
                            .isNotNull();
                    assertEquals(
                            importedApp
                                    .getPublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation(),
                            "top");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationInWorkspaceFromGit_WithAppLayoutInEditMode_ImportedAppHasAppLayoutInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("import-with-appLayout-in-editMode");

        Application testApplication = new Application();
        testApplication.setName(
                "importApplicationInWorkspaceFromGit_WithAppLayoutInEditMode_ImportedAppHasAppLayoutInEditAndViewMode");
        testApplication.setUnpublishedAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("testBranch");
        testApplication.setGitApplicationMetadata(gitData);
        Application savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Mono<Application> result = exportService
                .exportByArtifactId(
                        savedApplication.getId(), SerialiseArtifactObjective.VERSION_CONTROL, ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .flatMap(applicationJson -> {
                    // setting published mode resource as null, similar to the app json exported to git repo
                    applicationJson.getExportedApplication().setPublishedAppLayout(null);
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    workspaceId, savedApplication.getId(), applicationJson, gitData.getRefName())
                            .map(importableArtifact -> (Application) importableArtifact);
                });

        StepVerifier.create(result)
                .assertNext(importedApp -> {
                    assertThat(importedApp.getUnpublishedAppLayout()).isNotNull();
                    assertThat(importedApp.getPublishedAppLayout()).isNotNull();
                    assertThat(importedApp.getUnpublishedAppLayout().getType())
                            .isEqualTo(Application.AppLayout.Type.DESKTOP);
                    assertThat(importedApp.getPublishedAppLayout().getType())
                            .isEqualTo(Application.AppLayout.Type.DESKTOP);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            exportAndImportApplication_withMultiplePagesOrderDifferentInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName(
                "exportAndImportApplication_withMultiplePagesOrderDifferentInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        assert testApplication != null;

        PageDTO testPage1 = new PageDTO();
        testPage1.setName("testPage1");
        testPage1.setApplicationId(testApplication.getId());
        testPage1 = applicationPageService.createPage(testPage1).block();

        PageDTO testPage2 = new PageDTO();
        testPage2.setName("testPage2");
        testPage2.setApplicationId(testApplication.getId());
        testPage2 = applicationPageService.createPage(testPage2).block();

        // Deploy the current application so that edit and view mode will have different page order
        applicationPageService.publish(testApplication.getId(), true).block();

        // Set order for the newly created pages
        applicationPageService
                .reorderPage(testApplication.getId(), testPage1.getId(), 0)
                .block();
        applicationPageService
                .reorderPage(testApplication.getId(), testPage2.getId(), 1)
                .block();

        Mono<ApplicationJson> applicationJsonMono = exportService
                .exportByArtifactIdAndBranchName(testApplication.getId(), "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .cache();

        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    exportedApplication.setViewMode(false);
                    List<String> pageOrder = exportedApplication.getPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    assertThat(pageOrder.get(0)).isEqualTo("testPage1");
                    assertThat(pageOrder.get(1)).isEqualTo("testPage2");
                    assertThat(pageOrder.get(2)).isEqualTo("Page1");

                    pageOrder.clear();
                    pageOrder = exportedApplication.getPublishedPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    assertThat(pageOrder.get(0)).isEqualTo("Page1");
                    assertThat(pageOrder.get(1)).isEqualTo("testPage1");
                    assertThat(pageOrder.get(2)).isEqualTo("testPage2");
                })
                .verifyComplete();

        ApplicationJson applicationJson = applicationJsonMono.block();
        Application application = importService
                .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        // Get the unpublished pages and verify the order
        application.setViewMode(false);
        List<ApplicationPage> pageDTOS = application.getPages();
        Mono<NewPage> newPageMono1 = newPageService.findById(pageDTOS.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono2 = newPageService.findById(pageDTOS.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono3 = newPageService.findById(pageDTOS.get(2).getId(), MANAGE_PAGES);

        StepVerifier.create(Mono.zip(newPageMono1, newPageMono2, newPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getUnpublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage2.getUnpublishedPage().getName()).isEqualTo("testPage2");
                    assertThat(newPage3.getUnpublishedPage().getName()).isEqualTo("Page1");

                    assertThat(newPage1.getId()).isEqualTo(pageDTOS.get(0).getId());
                    assertThat(newPage2.getId()).isEqualTo(pageDTOS.get(1).getId());
                    assertThat(newPage3.getId()).isEqualTo(pageDTOS.get(2).getId());
                })
                .verifyComplete();

        // Get the published pages
        List<ApplicationPage> publishedPageDTOs = application.getPublishedPages();
        Mono<NewPage> newPublishedPageMono1 =
                newPageService.findById(publishedPageDTOs.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono2 =
                newPageService.findById(publishedPageDTOs.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono3 =
                newPageService.findById(publishedPageDTOs.get(2).getId(), MANAGE_PAGES);

        StepVerifier.create(Mono.zip(newPublishedPageMono1, newPublishedPageMono2, newPublishedPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getPublishedPage().getName()).isEqualTo("Page1");
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage3.getPublishedPage().getName()).isEqualTo("testPage2");

                    assertThat(newPage1.getId())
                            .isEqualTo(publishedPageDTOs.get(0).getId());
                    assertThat(newPage2.getId())
                            .isEqualTo(publishedPageDTOs.get(1).getId());
                    assertThat(newPage3.getId())
                            .isEqualTo(publishedPageDTOs.get(2).getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenThemeDoesNotExist_ExportedWithDefaultTheme() {
        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");

        String randomId = UUID.randomUUID().toString();
        Application testApplication = new Application();
        testApplication.setName("Application_" + randomId);
        Mono<ApplicationJson> exportedAppJson = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    application.setEditModeThemeId("invalid-theme-id");
                    application.setPublishedModeThemeId("invalid-theme-id");
                    String branchName = null;
                    return applicationService
                            .save(application)
                            .then(exportService.exportByArtifactIdAndBranchName(
                                    application.getId(), branchName, ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        StepVerifier.create(exportedAppJson)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getEditModeTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
                    assertThat(applicationJson.getPublishedTheme().getName())
                            .isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplication_WithBearerTokenAndExportWithConfig_exportedWithDecryptedFields() {
        String randomUUID = UUID.randomUUID().toString();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("workspace-" + randomUUID);
        Workspace workspace = workspaceService.create(testWorkspace).block();

        Application testApplication = new Application();
        testApplication.setName("application-" + randomUUID);
        testApplication.setExportWithConfiguration(true);
        testApplication.setWorkspaceId(workspace.getId());

        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    ApplicationAccessDTO accessDTO = new ApplicationAccessDTO();
                    accessDTO.setPublicAccess(true);
                    return applicationService
                            .changeViewAccessForSingleBranchByBranchedApplicationId(application.getId(), accessDTO)
                            .thenReturn(application);
                });

        Mono<Datasource> datasourceMono = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .zipWith(pluginRepository.findByPackageName("restapi-plugin"))
                .flatMap(objects -> {
                    String defaultEnvironmentId = objects.getT1();
                    Plugin plugin = objects.getT2();

                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setName("RestAPIWithBearerToken");
                    datasource.setWorkspaceId(workspace.getId());
                    datasource.setIsConfigured(true);

                    BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
                    bearerTokenAuth.setBearerToken("token_" + randomUUID);

                    SSLDetails sslDetails = new SSLDetails();
                    sslDetails.setAuthType(SSLDetails.AuthType.DEFAULT);
                    Connection connection = new Connection();
                    connection.setSsl(sslDetails);

                    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setAuthentication(bearerTokenAuth);
                    datasourceConfiguration.setConnection(connection);
                    datasourceConfiguration.setConnection(new Connection());
                    datasourceConfiguration.setUrl("https://mock-api.appsmith.com");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            defaultEnvironmentId,
                            new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    return datasourceService.create(datasource);
                });

        Mono<ApplicationJson> exportAppMono = Mono.zip(applicationMono, datasourceMono)
                .flatMap(objects -> {
                    ApplicationPage applicationPage = objects.getT1().getPages().get(0);
                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(applicationPage.getId());
                    action.setPluginId(objects.getT2().getPluginId());
                    action.setDatasource(objects.getT2());

                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    actionConfiguration.setPath("/test/path");
                    action.setActionConfiguration(actionConfiguration);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .then(exportService.exportByArtifactIdAndBranchName(
                                    objects.getT1().getId(), "", ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        StepVerifier.create(exportAppMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDecryptedFields()).isNotEmpty();
                    DecryptedSensitiveFields fields =
                            applicationJson.getDecryptedFields().get("RestAPIWithBearerToken");
                    assertThat(fields.getBearerTokenAuth().getBearerToken()).isEqualTo("token_" + randomUUID);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationTest_WithNavigationSettings() {

        Application application = new Application();
        application.setName("exportNavigationSettingsApplicationTest");
        Application.NavigationSetting navSetting = new Application.NavigationSetting();
        navSetting.setOrientation("top");
        application.setUnpublishedApplicationDetail(new ApplicationDetail());
        application.getUnpublishedApplicationDetail().setNavigationSetting(navSetting);
        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(createdApplication.getId(), "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication).isNotNull();
                    assertThat(exportedApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting())
                            .isNotNull();
                    assertThat(exportedApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplication_WithPageIcon_ValidPageIcon() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("exportPageIconApplicationTest");
        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("page_" + randomId);
        pageDTO.setIcon("flight");
        pageDTO.setApplicationId(createdApplication.getId());

        PageDTO applicationPageDTO = applicationPageService.createPage(pageDTO).block();

        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(applicationPageDTO.getApplicationId(), "", ArtifactType.APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    List<NewPage> pages = applicationJson.getPageList();
                    assertThat(pages).hasSize(2);
                    NewPage page = pages.stream()
                            .filter(page1 ->
                                    page1.getUnpublishedPage().getName().equals("page_" + randomId))
                            .findFirst()
                            .orElse(null);
                    assertThat(page).isNotNull();
                    assertThat(page.getUnpublishedPage().getName()).isEqualTo("page_" + randomId);
                    assertThat(page.getUnpublishedPage().getIcon()).isEqualTo("flight");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithCustomJSLibTest() {
        CustomJSLib jsLib = new CustomJSLib("TestLib", Set.of("accessor1"), "url", "docsUrl", "1.0", "defs_string");
        Mono<Boolean> addJSLibMonoCached = customJSLibService
                .addJSLibsToContext(testAppId, CreatorContextType.APPLICATION, Set.of(jsLib), false)
                .flatMap(isJSLibAdded ->
                        Mono.zip(Mono.just(isJSLibAdded), applicationPageService.publish(testAppId, true)))
                .map(tuple2 -> {
                    Boolean isJSLibAdded = tuple2.getT1();
                    Application application = tuple2.getT2();
                    return isJSLibAdded;
                })
                .cache();
        Mono<ApplicationJson> getExportedAppMono = addJSLibMonoCached
                .then(exportService.exportByArtifactIdAndBranchName(testAppId, "", ArtifactType.APPLICATION))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);

        StepVerifier.create(Mono.zip(addJSLibMonoCached, getExportedAppMono))
                .assertNext(tuple2 -> {
                    Boolean isJSLibAdded = tuple2.getT1();
                    assertEquals(true, isJSLibAdded);
                    ApplicationJson exportedAppJson = tuple2.getT2();
                    assertEquals(1, exportedAppJson.getCustomJSLibList().size());
                    CustomJSLib exportedJSLib =
                            exportedAppJson.getCustomJSLibList().get(0);
                    assertEquals(jsLib.getName(), exportedJSLib.getName());
                    assertEquals(jsLib.getAccessor(), exportedJSLib.getAccessor());
                    assertEquals(jsLib.getUrl(), exportedJSLib.getUrl());
                    assertEquals(jsLib.getDocsUrl(), exportedJSLib.getDocsUrl());
                    assertEquals(jsLib.getVersion(), exportedJSLib.getVersion());
                    assertEquals(jsLib.getDefs(), exportedJSLib.getDefs());
                    assertEquals(
                            getDTOFromCustomJSLib(jsLib),
                            exportedAppJson
                                    .getExportedApplication()
                                    .getUnpublishedCustomJSLibs()
                                    .toArray()[0]);
                    assertEquals(
                            1,
                            exportedAppJson
                                    .getExportedApplication()
                                    .getUnpublishedCustomJSLibs()
                                    .size());
                    assertEquals(
                            0,
                            exportedAppJson
                                    .getExportedApplication()
                                    .getPublishedCustomJSLibs()
                                    .size());
                })
                .verifyComplete();
    }

    private Mono<ActionDTO> createActionToPage(String actionName, String pageId) {
        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasourceMap.get("DS1"));
        action.setName(actionName);
        action.setPageId(pageId);
        return layoutActionService.createAction(action);
    }

    private Mono<ActionCollectionDTO> createActionCollectionToPage(Application application, int pageIndex) {
        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("TestJsObject");
        actionCollectionDTO1.setPageId(application.getPages().get(pageIndex).getId());
        actionCollectionDTO1.setApplicationId(application.getId());
        actionCollectionDTO1.setWorkspaceId(application.getWorkspaceId());
        actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("testMethod");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);
        return layoutCollectionService.createCollection(actionCollectionDTO1);
    }

    @Test
    @WithUserDetails("api_user")
    public void exportApplicationByWhen_WhenGitConnectedAndPageRenamed_QueriesAreInUpdatedResources() {
        String renamedPageName = "Renamed Page";
        // create an application
        Application testApplication = new Application();
        final String appName = UUID.randomUUID().toString();
        testApplication.setName(appName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());
        testApplication.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());

        Mono<ApplicationJson> applicationJsonMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    // add another page to the application
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("second_page");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService
                            .createPage(pageDTO) // get the updated application
                            .then(applicationService.findById(application.getId()));
                })
                .flatMap(application -> {
                    assert application.getPages().size() == 2;
                    // add one action to each of the pages
                    return createActionToPage(
                                    "first_page_action",
                                    application.getPages().get(0).getId())
                            .then(createActionToPage(
                                    "second_page_action",
                                    application.getPages().get(1).getId()))
                            .thenReturn(application);
                })
                .flatMap(application -> {
                    // add one action collection to each of the pages
                    return createActionCollectionToPage(application, 0)
                            .then(createActionCollectionToPage(application, 1))
                            .thenReturn(application);
                })
                .flatMap(application -> {
                    // set git meta data for the application and set a last commit date
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    // add buffer of 5 seconds so that the last commit date is definitely after the last updated date
                    gitArtifactMetadata.setLastCommittedAt(Instant.now());
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application);
                })
                .delayElement(Duration.ofMillis(
                        100)) // to make sure the last commit date is definitely after the last updated date
                .flatMap(application -> {
                    // rename the page
                    ApplicationPage applicationPage = application.getPages().get(0);
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName(renamedPageName);
                    return newPageService
                            .updatePage(applicationPage.getId(), pageDTO)
                            // export the application
                            .then(exportService.exportByArtifactId(
                                    application.getId(),
                                    SerialiseArtifactObjective.VERSION_CONTROL,
                                    ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        // verify that the exported json has the updated page name, and the queries are in the updated resources
        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    ModifiedResources modifiedResources = applicationJson.getModifiedResources();
                    assertThat(modifiedResources).isNotNull();
                    Map<String, Set<String>> updatedResources = modifiedResources.getModifiedResourceMap();
                    Set<String> updatedPageNames = updatedResources.get(FieldName.PAGE_LIST);
                    Set<String> updatedActionNames = updatedResources.get(FieldName.ACTION_LIST);
                    Set<String> updatedActionCollectionNames = updatedResources.get(FieldName.ACTION_COLLECTION_LIST);

                    assertThat(updatedPageNames).isNotNull();
                    assertThat(updatedActionNames).isNotNull();
                    assertThat(updatedActionCollectionNames).isNotNull();

                    // only the first page should be present in the updated resources
                    assertThat(updatedPageNames).hasSize(1);
                    assertThat(updatedPageNames).contains(renamedPageName);

                    // only actions from first page should be present in the updated resources
                    // 1 query + 1 method from action collection
                    assertThat(updatedActionNames).hasSize(2);
                    assertThat(updatedActionNames).contains("first_page_action" + NAME_SEPARATOR + renamedPageName);
                    assertThat(updatedActionNames)
                            .contains("TestJsObject.testMethod" + NAME_SEPARATOR + renamedPageName);

                    // only action collections from first page should be present in the updated resources
                    assertThat(updatedActionCollectionNames).hasSize(1);
                    assertThat(updatedActionCollectionNames)
                            .contains("TestJsObject" + NAME_SEPARATOR + renamedPageName);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void exportApplicationByWhen_WhenGitConnectedAndDatasourceRenamed_QueriesAreInUpdatedResources() {
        // create an application
        Application testApplication = new Application();
        final String appName = UUID.randomUUID().toString();
        testApplication.setName(appName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());
        testApplication.setServerSchemaVersion(jsonSchemaVersions.getServerVersion());

        Mono<ApplicationJson> applicationJsonMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    // add a datasource to the workspace
                    Datasource ds1 = new Datasource();
                    ds1.setName("DS_FOR_RENAME_TEST");
                    ds1.setWorkspaceId(workspaceId);
                    ds1.setPluginId(installedPlugin.getId());
                    final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setUrl("http://example.org/get");
                    datasourceConfiguration.setHeaders(List.of(new Property("X-Answer", "42")));

                    HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
                    storages1.put(
                            defaultEnvironmentId,
                            new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
                    ds1.setDatasourceStorages(storages1);
                    return datasourceService.create(ds1).zipWith(Mono.just(application));
                })
                .flatMap(objects -> {
                    Datasource datasource = objects.getT1();
                    Application application = objects.getT2();

                    // create an action with the datasource
                    ActionDTO action = new ActionDTO();
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);
                    action.setName("MyAction");
                    action.setPageId(application.getPages().get(0).getId());
                    return layoutActionService.createAction(action).thenReturn(objects);
                })
                .flatMap(objects -> {
                    Application application = objects.getT2();
                    // set git meta data for the application and set a last commit date
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    // add buffer of 5 seconds so that the last commit date is definitely after the last updated date
                    gitArtifactMetadata.setLastCommittedAt(Instant.now());
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application).thenReturn(objects);
                })
                .delayElement(Duration.ofMillis(
                        100)) // to make sure the last commit date is definitely after the last updated date
                .flatMap(objects -> {
                    // rename the datasource
                    Datasource datasource = objects.getT1();
                    Application application = objects.getT2();
                    datasource.setName("DS_FOR_RENAME_TEST_RENAMED");
                    return datasourceService
                            .save(datasource, false)
                            .then(exportService.exportByArtifactId(
                                    application.getId(),
                                    SerialiseArtifactObjective.VERSION_CONTROL,
                                    ArtifactType.APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        // verify that the exported json has the updated page name, and the queries are in the updated resources
        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    ModifiedResources modifiedResources = applicationJson.getModifiedResources();
                    Map<String, Set<String>> updatedResources = modifiedResources.getModifiedResourceMap();
                    assertThat(updatedResources).isNotNull();
                    Set<String> updatedActionNames = updatedResources.get(FieldName.ACTION_LIST);
                    assertThat(updatedActionNames).isNotNull();

                    // action should be present in the updated resources although action not updated but datasource is
                    assertThat(updatedActionNames).hasSize(1);
                    updatedActionNames.forEach(actionName -> {
                        assertThat(actionName).contains("MyAction");
                    });
                })
                .verifyComplete();
    }
}
