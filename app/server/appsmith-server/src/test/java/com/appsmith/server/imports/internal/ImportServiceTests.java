package com.appsmith.server.imports.internal;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.helpers.AppsmithBeanUtils;
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
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ImportExportConstants;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationMode;
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
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.NAME_SEPARATOR;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PAGE_LAYOUT;
import static com.appsmith.server.dtos.ce.CustomJSLibContextCE_DTO.getDTOFromCustomJSLib;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

@Slf4j
@SpringBootTest
@DirtiesContext
@TestMethodOrder(MethodOrderer.MethodName.class)
public class ImportServiceTests {
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
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    Gson gson;

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
    ThemeRepository themeRepository;

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
    ApplicationPermission applicationPermission;

    @SpyBean
    PluginService pluginService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

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
        testApplication.setClientSchemaVersion(jsonSchemaVersions.getClientVersion());

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

    private Flux<ActionDTO> getActionsInApplication(Application application) {
        return newPageService
                // fetch the unpublished pages
                .findByApplicationId(application.getId(), READ_PAGES, false)
                .flatMap(page -> newActionService.getUnpublishedActions(
                        new LinkedMultiValueMap<>(Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId()))),
                        RefType.branch,
                        ""));
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = createFilePart(filePath);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content()).map(dataBuffer -> {
            byte[] data = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(data);
            DataBufferUtils.release(dataBuffer);
            return new String(data);
        });

        return stringifiedFile
                .map(data -> {
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .flatMap(applicationJson -> jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(
                        applicationJson, null, null, null))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
    }

    private Workspace createTemplateWorkspace() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        return workspaceService.create(newWorkspace).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenContainsInternalFields_InternalFieldsNotExported() {
        Mono<ApplicationJson> resultMono = exportService
                .exportByArtifactIdAndBranchName(testAppId, "", APPLICATION)
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
                .flatMap(application ->
                        exportService.exportByArtifactIdAndBranchName(application.getId(), "", APPLICATION))
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
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS2"));

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("validAction2");
                    action2.setPageId(testPage.getId());
                    action2.setExecuteOnLoad(true);
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
                            .then(exportService.exportByArtifactIdAndBranchName(testApp.getId(), "", APPLICATION))
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
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(ds1);

                    return layoutActionService
                            .createAction(action)
                            .then(exportService.exportByArtifactId(testApp.getId(), VERSION_CONTROL, APPLICATION))
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
    public void importArtifactFromInvalidFileTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<? extends ArtifactImportDTO> resultMono =
                importService.extractArtifactExchangeJsonAndSaveArtifact(filepart, workspaceId, null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactWithNullWorkspaceIdTest() {
        Mono<? extends ArtifactImportDTO> resultMono =
                importService.extractArtifactExchangeJsonAndSaveArtifact("", null, null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromInvalidJsonFileWithoutPagesTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-pages.json");

        Mono<? extends ArtifactImportDTO> resultMono =
                importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.VALIDATION_FAILURE.getMessage(
                                        "Field '" + FieldName.PAGE_LIST + "' is missing in the JSON.")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromInvalidJsonFileWithoutArtifactTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-app.json");
        Mono<? extends ArtifactImportDTO> resultMono =
                importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, null);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.VALIDATION_FAILURE.getMessage("Field '" + FieldName.APPLICATION
                                        + ImportExportConstants.ARTIFACT_JSON_IMPORT_VALIDATION_ERROR_MESSAGE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromValidJsonFileTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        String environmentId = workspaceMono
                .flatMap(workspace -> workspaceService.getDefaultEnvironmentId(
                        workspace.getId(), environmentPermission.getExecutePermission()))
                .block();

        final Mono<? extends ArtifactImportDTO> resultMono = workspaceMono.flatMap(workspace ->
                importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null));

        List<PermissionGroup> permissionGroups = workspaceMono
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

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        StepVerifier.create(resultMono.flatMap(importArtifactDTO -> {
                    ApplicationImportDTO applicationImportDTO = (ApplicationImportDTO) importArtifactDTO;
                    Application application = applicationImportDTO.getApplication();
                    return Mono.zip(
                            Mono.just(applicationImportDTO),
                            datasourceService
                                    .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), MANAGE_DATASOURCES)
                                    .collectList(),
                            newActionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                    .collectList(),
                            newPageService
                                    .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                    .collectList(),
                            actionCollectionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList(),
                            customJSLibService.getAllJSLibsInContext(
                                    application.getId(), CreatorContextType.APPLICATION, false),
                            applicationService.findById(
                                    applicationImportDTO.getApplication().getId(), MANAGE_APPLICATIONS));
                }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT7();
                    final List<Datasource> unConfiguredDatasourceList =
                            tuple.getT1().getUnConfiguredDatasourceList();
                    final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();
                    final List<CustomJSLib> importedJSLibList = tuple.getT6();

                    // although the imported list had only one jsLib entry, the other entry comes from ensuring an xml
                    // parser entry for backward compatibility
                    assertEquals(2, importedJSLibList.size());
                    CustomJSLib importedJSLib = (CustomJSLib) importedJSLibList.toArray()[0];
                    CustomJSLib expectedJSLib = new CustomJSLib(
                            "TestLib", Set.of("accessor1"), "url", "docsUrl", "1" + ".0", "defs_string");
                    assertEquals(expectedJSLib.getName(), importedJSLib.getName());
                    assertEquals(expectedJSLib.getAccessor(), importedJSLib.getAccessor());
                    assertEquals(expectedJSLib.getUrl(), importedJSLib.getUrl());
                    assertEquals(expectedJSLib.getDocsUrl(), importedJSLib.getDocsUrl());
                    assertEquals(expectedJSLib.getVersion(), importedJSLib.getVersion());
                    assertEquals(expectedJSLib.getDefs(), importedJSLib.getDefs());
                    // although the imported list had only one jsLib entry, the other entry comes from ensuring an xml
                    // parser entry for backward compatibility
                    assertEquals(2, application.getUnpublishedCustomJSLibs().size());

                    assertThat(application.getName()).isEqualTo("valid_application");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNull();
                    assertThat(isPartialImport).isEqualTo(Boolean.TRUE);
                    assertThat(unConfiguredDatasourceList).isNotNull();

                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getWorkspaceId()).isEqualTo(application.getWorkspaceId());
                        DatasourceStorageDTO storageDTO =
                                datasource.getDatasourceStorages().get(environmentId);
                        assertThat(storageDTO.getDatasourceConfiguration()).isNotNull();
                    });

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getPageId())
                                .isNotEqualTo(pageList.get(0).getName());

                        if (StringUtils.equals(actionDTO.getName(), "api_wo_auth")) {
                            ActionDTO publishedAction = newAction.getPublishedAction();
                            assertThat(publishedAction).isNotNull();
                            assertThat(publishedAction.getActionConfiguration()).isNotNull();
                            // Test the fallback page ID from the unpublishedAction is copied to published version when
                            // published version does not have pageId
                            assertThat(actionDTO.getPageId()).isEqualTo(publishedAction.getPageId());
                            // check that createAt field is getting populated from JSON
                            assertThat(actionDTO.getCreatedAt()).isEqualTo("2023-12-13T12:10:02Z");
                        }

                        if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                            collectionIdInAction.add(actionDTO.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).isNotEmpty();
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection().getPageId())
                                .isNotEqualTo(pageList.get(0).getName());
                        if (StringUtils.equals(
                                actionCollection.getUnpublishedCollection().getName(), "JSObject2")) {
                            // Check if this action collection is not attached to any action
                            assertThat(collectionIdInAction).doesNotContain(actionCollection.getId());
                        } else {
                            assertThat(collectionIdInAction).contains(actionCollection.getId());
                        }
                    });

                    assertThat(pageList).hasSize(2);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importFromValidJson_cancelledMidway_importSuccess() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Midway cancel import app workspace");
        newWorkspace = workspaceService.create(newWorkspace).block();

        importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, newWorkspace.getId(), null)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for import to complete
        Mono<Application> importedAppFromDbMono = Mono.just(newWorkspace).flatMap(workspace -> {
            try {
                // Before fetching the imported application, sleep for 5 seconds to ensure that the import completes
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationRepository
                    .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                    .next();
        });

        StepVerifier.create(importedAppFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationInWorkspace_WhenCustomizedThemes_ThemesCreated() {
        FilePart filePart =
                createFilePart("test_assets/ImportExportServiceTest/valid-application-with-custom-themes.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Import theme test org");

        final Mono<Application> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO)
                .flatMap(importDTO ->
                        applicationService.findById(importDTO.getApplication().getId(), MANAGE_APPLICATIONS));

        StepVerifier.create(resultMono.flatMap(applicationImportDTO -> Mono.zip(
                        Mono.just(applicationImportDTO),
                        themeRepository.findById(applicationImportDTO.getEditModeThemeId()))))
                .assertNext(tuple -> {
                    Theme editTheme = tuple.getT2();

                    assertThat(editTheme.isSystemTheme()).isFalse();
                    assertThat(editTheme.getDisplayName()).isEqualTo("Custom edit theme");
                    assertThat(editTheme.getWorkspaceId()).isNull();
                    assertThat(editTheme.getApplicationId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifact_withoutActionCollection_succeedsWithoutError() {

        FilePart filePart =
                createFilePart("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        List<PermissionGroup> permissionGroups = workspaceMono
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

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        StepVerifier.create(resultMono.flatMap(applicationImportDTO -> Mono.zip(
                        Mono.just(applicationImportDTO),
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(
                                        applicationImportDTO.getApplication().getWorkspaceId(), MANAGE_DATASOURCES)
                                .collectList(),
                        getActionsInApplication(applicationImportDTO.getApplication())
                                .collectList(),
                        newPageService
                                .findByApplicationId(
                                        applicationImportDTO.getApplication().getId(), MANAGE_PAGES, false)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(
                                        applicationImportDTO.getApplication().getId(), false, MANAGE_ACTIONS, null)
                                .collectList(),
                        workspaceMono.flatMap(workspace -> workspaceService.getDefaultEnvironmentId(
                                workspace.getId(), environmentPermission.getExecutePermission())))))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<ActionDTO> actionDTOS = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();
                    String environmentId = tuple.getT6();

                    assertThat(application.getName()).isEqualTo("valid_application");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();

                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getWorkspaceId()).isEqualTo(application.getWorkspaceId());
                        DatasourceStorageDTO storageDTO =
                                datasource.getDatasourceStorages().get(environmentId);
                        assertThat(storageDTO.getDatasourceConfiguration()).isNotNull();
                    });

                    assertThat(actionDTOS).isNotEmpty();
                    actionDTOS.forEach(actionDTO -> {
                        assertThat(actionDTO.getPageId())
                                .isNotEqualTo(pageList.get(0).getName());
                    });

                    assertThat(actionCollectionList).isEmpty();

                    assertThat(pageList).hasSize(2);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifact_WithoutThemes_LegacyThemesAssigned() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application-without-theme.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        final Mono<Application> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .flatMap(importableArtifactDTO -> {
                    ApplicationImportDTO applicationImportDTO = (ApplicationImportDTO) importableArtifactDTO;
                    return applicationService.findById(
                            applicationImportDTO.getApplication().getId(), MANAGE_APPLICATIONS);
                });

        StepVerifier.create(resultMono)
                .assertNext(applicationImportDTO -> {
                    assertThat(applicationImportDTO.getEditModeThemeId()).isNotEmpty();
                    assertThat(applicationImportDTO.getPublishedModeThemeId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifact_withoutPageIdInActionCollection_succeeds() {

        FilePart filePart = createFilePart(
                "test_assets/ImportExportServiceTest/invalid-application-without-pageId-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        final Mono<ApplicationImportDTO> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono.flatMap(applicationImportDTO -> Mono.zip(
                        Mono.just(applicationImportDTO),
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(
                                        applicationImportDTO.getApplication().getWorkspaceId(), MANAGE_DATASOURCES)
                                .collectList(),
                        getActionsInApplication(applicationImportDTO.getApplication())
                                .collectList(),
                        newPageService
                                .findByApplicationId(
                                        applicationImportDTO.getApplication().getId(), MANAGE_PAGES, false)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(
                                        applicationImportDTO.getApplication().getId(), false, MANAGE_ACTIONS, null)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<ActionDTO> actionDTOS = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

                    assertThat(datasourceList).isNotEmpty();

                    assertThat(actionDTOS).hasSize(1);
                    actionDTOS.forEach(actionDTO -> {
                        assertThat(actionDTO.getPageId())
                                .isNotEqualTo(pageList.get(0).getName());
                    });

                    assertThat(actionCollectionList).isEmpty();
                })
                .verifyComplete();
    }

    // this test would be re-written post export flow is completed
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
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS1"));
                    return layoutActionService
                            .createAction(action)
                            .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS));
                })
                .then(exportService
                        .exportByArtifactId(savedApplication.getId(), VERSION_CONTROL, APPLICATION)
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
    public void importApplication_incompatibleJsonFile_throwException() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/incompatible_version.json");
        Mono<ApplicationImportDTO> resultMono = importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, null)
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INCOMPATIBLE_IMPORTED_JSON.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withUnConfiguredDatasources_Success() {
        FilePart filePart = createFilePart(
                "test_assets/ImportExportServiceTest/valid-application-with-un-configured-datasource.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        List<PermissionGroup> permissionGroups = workspaceMono
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

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        StepVerifier.create(resultMono.flatMap(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    return Mono.zip(
                            Mono.just(applicationImportDTO),
                            datasourceService
                                    .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), MANAGE_DATASOURCES)
                                    .collectList(),
                            newActionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                    .collectList(),
                            newPageService
                                    .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                    .collectList(),
                            actionCollectionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList(),
                            applicationService.findById(
                                    applicationImportDTO.getApplication().getId(), MANAGE_APPLICATIONS));
                }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT6();
                    final List<Datasource> unConfiguredDatasourceList =
                            tuple.getT1().getUnConfiguredDatasourceList();
                    final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("importExportTest");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNull();
                    assertThat(isPartialImport).isEqualTo(Boolean.TRUE);
                    assertThat(unConfiguredDatasourceList.size()).isNotEqualTo(0);

                    assertThat(datasourceList).isNotEmpty();
                    List<String> datasourceNames = unConfiguredDatasourceList.stream()
                            .map(Datasource::getName)
                            .collect(Collectors.toList());
                    assertThat(datasourceNames).contains("mongoDatasource", "postgresTest");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getPageId())
                                .isNotEqualTo(pageList.get(0).getName());
                        if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                            collectionIdInAction.add(actionDTO.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).isEmpty();

                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactIntoWorkspace_pageRemovedAndUpdatedDefaultPageNameInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoWorkspace_pageRemovedInBranchApplication_Success");
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
        String gitSyncIdBeforeImport = newPageService
                .findById(application.getPages().get(0).getId(), MANAGE_PAGES)
                .block()
                .getGitSyncId();

        PageDTO page = new PageDTO();
        page.setName("Page 2");
        page.setApplicationId(application.getId());
        PageDTO savedPage = applicationPageService.createPage(page).block();

        assert application.getId() != null;
        Set<String> applicationPageIdsBeforeImport =
                Objects.requireNonNull(applicationRepository
                                .findById(application.getId())
                                .block())
                        .getPages()
                        .stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toSet());

        ApplicationJson applicationJson = createAppJson(
                        "test_assets/ImportExportServiceTest/valid-application-with-page-removed.json")
                .block();
        applicationJson.getPageList().get(0).setGitSyncId(gitSyncIdBeforeImport);

        Application importedApplication = importService
                .importArtifactInWorkspaceFromGit(workspaceId, application.getId(), applicationJson, "master")
                .map(artifact -> (Application) artifact)
                .block();

        assert importedApplication != null;
        Mono<List<NewPage>> pageList = Flux.fromIterable(importedApplication.getPages().stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toList()))
                .flatMap(s -> newPageService.findById(s, MANAGE_PAGES))
                .collectList();

        StepVerifier.create(pageList)
                .assertNext(newPages -> {
                    // Check before import we had both the pages
                    assertThat(applicationPageIdsBeforeImport).hasSize(2);
                    assertThat(applicationPageIdsBeforeImport).contains(savedPage.getId());

                    assertThat(newPages).hasSize(1);
                    assertThat(importedApplication.getPages()).hasSize(1);
                    assertThat(importedApplication.getPages().get(0).getId())
                            .isEqualTo(newPages.get(0).getId());
                    assertThat(newPages.get(0).getPublishedPage().getName()).isEqualTo("importedPage");
                    assertThat(newPages.get(0).getGitSyncId()).isEqualTo(gitSyncIdBeforeImport);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactIntoWorkspace_pageAddedInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoWorkspace_pageAddedInBranchApplication_Success");
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

        String gitSyncIdBeforeImport = newPageService
                .findById(application.getPages().get(0).getId(), MANAGE_PAGES)
                .block()
                .getGitSyncId();

        assert application.getId() != null;
        Set<String> applicationPageIdsBeforeImport =
                Objects.requireNonNull(applicationRepository
                                .findById(application.getId())
                                .block())
                        .getPages()
                        .stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toSet());

        ApplicationJson applicationJson = createAppJson(
                        "test_assets/ImportExportServiceTest/valid-application-with-page-added.json")
                .block();
        applicationJson.getPageList().get(0).setGitSyncId(gitSyncIdBeforeImport);

        Application applicationMono = importService
                .importArtifactInWorkspaceFromGit(workspaceId, application.getId(), applicationJson, "master")
                .map(artifact -> (Application) artifact)
                .block();

        Mono<List<NewPage>> pageList = Flux.fromIterable(applicationMono.getPages().stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toList()))
                .flatMap(s -> newPageService.findById(s, MANAGE_PAGES))
                .collectList();

        StepVerifier.create(pageList)
                .assertNext(newPages -> {
                    // Check before import we had both the pages
                    assertThat(applicationPageIdsBeforeImport).hasSize(1);
                    assertThat(newPages).hasSize(3);
                    List<String> pageNames = newPages.stream()
                            .map(newPage -> newPage.getUnpublishedPage().getName())
                            .collect(Collectors.toList());
                    assertThat(pageNames).contains("Page1");
                    assertThat(pageNames).contains("Page2");
                    assertThat(pageNames).contains("Page3");
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
                .exportByArtifactIdAndBranchName(application.getId(), "master", APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .flatMap(applicationJson -> importService
                        .importArtifactInWorkspaceFromGit(workspaceId, application.getId(), applicationJson, "master")
                        .map(artifact -> (Application) artifact));

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getIsPublic()).isEqualTo(Boolean.TRUE);
                    assertThat(application1.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Add new page to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added page will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_addNewPageAfterImport_addedPageRemoved() {

        /*
        1. Import application
        2. Add single page to imported app
        3. Import the application from same JSON with applicationId
        4. Added page should be deleted from DB
         */
        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-added");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("discard-page-test");
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationRepository.findById(page.getApplicationId()))
                .cache();
        List<PageDTO> pageListBefore = resultMonoWithoutDiscardOperation
                .flatMap(application -> newPageService
                        .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                        .collectList())
                .block();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-page-added");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(3);
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNull();

                    assertThat(pageList).hasSize(3);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();

                    List<String> pageNames = new ArrayList<>();
                    pageList.forEach(page -> pageNames.add(page.getName()));
                    assertThat(pageNames).contains("discard-page-test");
                })
                .verifyComplete();

        // Import the same application again to find if the added page is deleted
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPublishedPages()).hasSize(1);

                    assertThat(pageList).hasSize(2);
                    for (PageDTO page : pageList) {
                        PageDTO curentPage = pageListBefore.stream()
                                .filter(pageDTO -> pageDTO.getId().equals(page.getId()))
                                .collect(Collectors.toList())
                                .get(0);
                        assertThat(page.getPolicies()).isEqualTo(curentPage.getPolicies());
                    }

                    List<String> pageNames = new ArrayList<>();
                    pageList.forEach(page -> pageNames.add(page.getName()));
                    assertThat(pageNames).doesNotContain("discard-page-test");
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Add new action to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added action will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_addNewActionAfterImport_addedActionRemoved() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();

        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-added");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    ActionDTO action = new ActionDTO();
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS1"));
                    action.setName("discard-action-test");
                    action.setPageId(application.getPages().get(0).getId());
                    return layoutActionService.createAction(action);
                })
                .flatMap(actionDTO -> newActionService.getByIdWithoutPermissionCheck(actionDTO.getId()))
                .flatMap(newAction -> applicationRepository.findById(newAction.getApplicationId()))
                .cache();

        List<ActionDTO> actionListBefore = resultMonoWithoutDiscardOperation
                .flatMap(application -> getActionsInApplication(application).collectList())
                .block();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionDTO> actionList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-action-added");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).contains("discard-action-test");
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionDTO> actionList = tuple.getT2();

                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getServerSchemaVersion()).isNotNull();
                    assertThat(application.getClientSchemaVersion()).isNotNull();

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).doesNotContain("discard-action-test");
                    for (ActionDTO action : actionListBefore) {
                        ActionDTO currentAction = actionListBefore.stream()
                                .filter(actionDTO -> actionDTO.getId().equals(action.getId()))
                                .collect(Collectors.toList())
                                .get(0);
                        assertThat(action.getPolicies()).isEqualTo(currentAction.getPolicies());
                    }
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Add actionCollection to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added actionCollection will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_addNewActionCollectionAfterImport_addedActionCollectionRemoved() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-added");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
                    actionCollectionDTO1.setName("discard-action-collection-test");
                    actionCollectionDTO1.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO1.setApplicationId(application.getId());
                    actionCollectionDTO1.setWorkspaceId(application.getWorkspaceId());
                    actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("discard-action-collection-test-action");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO1.setActions(List.of(action1));
                    actionCollectionDTO1.setPluginType(PluginType.JS);

                    return layoutCollectionService.createCollection(actionCollectionDTO1);
                })
                .flatMap(actionCollectionDTO ->
                        actionCollectionService.getByIdWithoutPermissionCheck(actionCollectionDTO.getId()))
                .flatMap(actionCollection -> applicationRepository.findById(actionCollection.getApplicationId()))
                .cache();

        List<ActionCollection> actionCollectionListBefore = resultMonoWithoutDiscardOperation
                .flatMap(application -> actionCollectionService
                        .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                        .collectList())
                .block();
        List<ActionDTO> actionListBefore = resultMonoWithoutDiscardOperation
                .flatMap(application -> getActionsInApplication(application).collectList())
                .block();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();
                    final List<ActionDTO> actionList = tuple.getT3();

                    assertThat(application.getName()).isEqualTo("discard-change-collection-added");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(
                            actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).contains("discard-action-collection-test");

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).contains("discard-action-collection-test-action");
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();
                    final List<ActionDTO> actionList = tuple.getT3();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(
                            actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).doesNotContain("discard-action-collection-test");

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).doesNotContain("discard-action-collection-test-action");
                    for (ActionDTO action : actionListBefore) {
                        ActionDTO currentAction = actionListBefore.stream()
                                .filter(actionDTO -> actionDTO.getId().equals(action.getId()))
                                .collect(Collectors.toList())
                                .get(0);
                        assertThat(action.getPolicies()).isEqualTo(currentAction.getPolicies());
                    }

                    for (ActionCollection actionCollection : actionCollectionListBefore) {
                        ActionCollection currentAction = actionCollectionListBefore.stream()
                                .filter(actionDTO -> actionDTO.getId().equals(actionCollection.getId()))
                                .collect(Collectors.toList())
                                .get(0);
                        assertThat(actionCollection.getPolicies())
                                .containsExactlyInAnyOrderElementsOf(currentAction.getPolicies());
                    }
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Remove existing page from imported application
     * 3. Import application from same application json file
     * 4. Removed page will be restored
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_removeNewPageAfterImport_removedPageRestored() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-removed");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    Optional<ApplicationPage> applicationPage = application.getPages().stream()
                            .filter(page -> !page.isDefault())
                            .findFirst();
                    return applicationPageService.deleteUnpublishedPage(
                            applicationPage.get().getId());
                })
                .flatMap(page -> applicationRepository.findById(page.getApplicationId()))
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-page-removed");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);

                    assertThat(pageList).hasSize(1);
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPublishedPages()).hasSize(1);

                    assertThat(pageList).hasSize(2);
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Remove existing action from imported application
     * 3. Import application from same application json file
     * 4. Removed action will be restored
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_removeNewActionAfterImport_removedActionRestored() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final String[] deletedActionName = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-removed");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    return getActionsInApplication(application)
                            .next()
                            .flatMap(actionDTO -> {
                                deletedActionName[0] = actionDTO.getName();
                                return newActionService.deleteUnpublishedAction(actionDTO.getId());
                            })
                            .then(applicationPageService.publish(application.getId(), true));
                })
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionDTO> actionList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-action-removed");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).doesNotContain(deletedActionName[0]);
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        getActionsInApplication(application).collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionDTO> actionList = tuple.getT2();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).contains(deletedActionName[0]);
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Remove existing actionCollection from imported application
     * 3. Import application from same application json file
     * 4. Removed actionCollection along-with actions will be restored
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_removeNewActionCollection_removedActionCollectionRestored() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final String[] deletedActionCollectionNames = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-removed");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    return actionCollectionService
                            .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                            .next()
                            .flatMap(actionCollection -> {
                                deletedActionCollectionNames[0] = actionCollection
                                        .getUnpublishedCollection()
                                        .getName();
                                return actionCollectionService.deleteUnpublishedActionCollection(
                                        actionCollection.getId());
                            })
                            .then(applicationPageService.publish(application.getId(), true));
                })
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-collection-removed");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(
                            actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).doesNotContain(deletedActionCollectionNames);
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(
                            actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).contains(deletedActionCollectionNames);
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Add Navigation Settings to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added NavigationSetting will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_addNavigationAndThemeSettingAfterImport_addedNavigationAndThemeSettingRemoved() {
        Mono<ApplicationJson> applicationJsonMono = createAppJson(
                "test_assets/ImportExportServiceTest/valid-application-without-navigation-theme-setting.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-navsettings-added");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    ApplicationDetail applicationDetail = new ApplicationDetail();
                    Application.NavigationSetting navigationSetting = new Application.NavigationSetting();
                    navigationSetting.setOrientation("top");
                    applicationDetail.setNavigationSetting(navigationSetting);

                    Application.ThemeSetting themeSettings = getThemeSetting();
                    applicationDetail.setThemeSetting(themeSettings);

                    application.setUnpublishedApplicationDetail(applicationDetail);
                    application.setPublishedApplicationDetail(applicationDetail);
                    return applicationService.save(application);
                })
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation)
                .assertNext(initialApplication -> {
                    assertThat(initialApplication.getUnpublishedApplicationDetail())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");
                    assertThat(initialApplication.getPublishedApplicationDetail())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getNavigationSetting())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");

                    Application.ThemeSetting themes =
                            initialApplication.getApplicationDetail().getThemeSetting();
                    assertThat(themes.getAccentColor()).isEqualTo("#FFFFFF");
                    assertThat(themes.getBorderRadius()).isEqualTo("#000000");
                    assertThat(themes.getColorMode()).isEqualTo(Application.ThemeSetting.Type.LIGHT);
                    assertThat(themes.getDensity()).isEqualTo(1);
                    assertThat(themes.getFontFamily()).isEqualTo("#000000");
                    assertThat(themes.getSizing()).isEqualTo(1);
                })
                .verifyComplete();
        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation)
                .assertNext(application -> {
                    assertThat(application.getWorkspaceId()).isNotNull();
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
        return themeSettings;
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org
     * 2. Updated App Layout Settings to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added App Layout will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChange_addAppLayoutAfterImport_addedAppLayoutRemoved() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application-without-app-layout.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-applayout-added");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    application.setUnpublishedAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
                    application.setPublishedAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
                    return applicationService.save(application);
                })
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation)
                .assertNext(initialApplication -> {
                    assertThat(initialApplication.getUnpublishedAppLayout()).isNotNull();
                    assertThat(initialApplication.getUnpublishedAppLayout().getType())
                            .isEqualTo(Application.AppLayout.Type.DESKTOP);
                    assertThat(initialApplication.getPublishedAppLayout()).isNotNull();
                    assertThat(initialApplication.getPublishedAppLayout().getType())
                            .isEqualTo(Application.AppLayout.Type.DESKTOP);
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation)
                .assertNext(application -> {
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getUnpublishedAppLayout()).isNull();
                    assertThat(application.getPublishedAppLayout()).isNull();
                })
                .verifyComplete();
    }

    /**
     * Testcase for checking the discard changes flow for following events:
     * 1. Import application in org which has app positioning in applicationDetail already added
     * 2. Add Navigation Settings to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added NavigationSetting will be removed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void
            discardChange_addNavigationSettingAfterAppPositioningAlreadyPresentInImport_addedNavigationSettingRemoved() {
        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application-with-app-positioning.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson
                            .getExportedApplication()
                            .setName("discard-change-navsettings-added-appPositioning-present");
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspaceId, applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                })
                .flatMap(application -> {
                    ApplicationDetail applicationDetail = application.getUnpublishedApplicationDetail();
                    Application.NavigationSetting navigationSetting = new Application.NavigationSetting();
                    navigationSetting.setOrientation("top");
                    applicationDetail.setNavigationSetting(navigationSetting);
                    application.setUnpublishedApplicationDetail(applicationDetail);
                    application.setPublishedApplicationDetail(applicationDetail);
                    return applicationService.save(application);
                })
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation)
                .assertNext(initialApplication -> {
                    assertThat(initialApplication.getUnpublishedApplicationDetail())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");
                    assertThat(initialApplication.getPublishedApplicationDetail())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getNavigationSetting())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getAppPositioning())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getUnpublishedApplicationDetail()
                                    .getAppPositioning()
                                    .getType())
                            .isEqualTo(Application.AppPositioning.Type.AUTO);
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getAppPositioning())
                            .isNotNull();
                    assertThat(initialApplication
                                    .getPublishedApplicationDetail()
                                    .getAppPositioning()
                                    .getType())
                            .isEqualTo(Application.AppPositioning.Type.AUTO);
                })
                .verifyComplete();
        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation.flatMap(
                importedApplication -> applicationJsonMono.flatMap(applicationJson -> {
                    importedApplication.setGitApplicationMetadata(new GitArtifactMetadata());
                    importedApplication
                            .getGitApplicationMetadata()
                            .setDefaultApplicationId(importedApplication.getId());
                    return applicationService
                            .save(importedApplication)
                            .then(importService.importArtifactInWorkspaceFromGit(
                                    importedApplication.getWorkspaceId(),
                                    importedApplication.getId(),
                                    applicationJson,
                                    "main"))
                            .map(importableArtifact -> (Application) importableArtifact);
                }));

        StepVerifier.create(resultMonoWithDiscardOperation)
                .assertNext(application -> {
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getUnpublishedApplicationDetail()).isNotNull();
                    assertThat(application.getPublishedApplicationDetail()).isNotNull();
                    assertThat(application.getUnpublishedApplicationDetail().getAppPositioning())
                            .isNotNull();
                    assertThat(application
                                    .getUnpublishedApplicationDetail()
                                    .getAppPositioning()
                                    .getType())
                            .isEqualTo(Application.AppPositioning.Type.AUTO);
                    assertThat(application.getUnpublishedApplicationDetail().getNavigationSetting())
                            .isNull();
                    assertThat(application.getPublishedApplicationDetail().getNavigationSetting())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void applySchemaMigration_jsonFileWithFirstVersion_migratedToLatestVersionSuccess() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/file-with-v1.json");

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content()).map(dataBuffer -> {
            byte[] data = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(data);
            DataBufferUtils.release(dataBuffer);
            return new String(data);
        });
        Mono<ApplicationJson> v1ApplicationMono = stringifiedFile
                .map(data -> {
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .cache();

        Mono<ApplicationJson> migratedApplicationMono = v1ApplicationMono
                .flatMap(applicationJson -> {
                    ApplicationJson applicationJson1 = new ApplicationJson();
                    AppsmithBeanUtils.copyNestedNonNullProperties(applicationJson, applicationJson1);
                    return jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(
                            applicationJson1, null, null, null);
                })
                .map(applicationJson -> (ApplicationJson) applicationJson);

        StepVerifier.create(Mono.zip(v1ApplicationMono, migratedApplicationMono))
                .assertNext(tuple -> {
                    ApplicationJson v1ApplicationJson = tuple.getT1();
                    ApplicationJson latestApplicationJson = tuple.getT2();

                    assertThat(v1ApplicationJson.getServerSchemaVersion()).isEqualTo(1);
                    assertThat(v1ApplicationJson.getClientSchemaVersion()).isEqualTo(2);

                    assertThat(latestApplicationJson.getServerSchemaVersion())
                            .isEqualTo(jsonSchemaVersions.getServerVersion());
                    assertThat(latestApplicationJson.getClientSchemaVersion())
                            .isEqualTo(jsonSchemaVersions.getClientVersion());
                })
                .verifyComplete();
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
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasourceMap.get("DS2"));

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("validAction2");
                    action2.setPageId(testPage.getId());
                    action2.setExecuteOnLoad(true);
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
                            .then(exportService.exportByArtifactIdAndBranchName(testApp.getId(), "", APPLICATION))
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

    @Test
    @WithUserDetails(value = "api_user")
    public void
            importApplication_datasourceWithSameNameAndDifferentPlugin_importedWithValidActionsAndSuffixedDatasource() {

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Duplicate datasource with different plugin org");
        testWorkspace = workspaceService.create(testWorkspace).block();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Datasource testDatasource = new Datasource();
        // Chose any plugin except for mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        testDatasource.setDatasourceStorages(storages);

        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(testWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        StepVerifier.create(resultMono.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), MANAGE_DATASOURCES)
                                .collectList(),
                        newActionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();

                    assertThat(application.getName()).isEqualTo("valid_application");

                    List<String> datasourceNameList = new ArrayList<>();
                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getWorkspaceId()).isEqualTo(application.getWorkspaceId());
                        datasourceNameList.add(datasource.getName());
                    });
                    // Check if both suffixed and newly imported datasource are present
                    assertThat(datasourceNameList).contains(datasourceName, datasourceName + " #1");

                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getDatasource()).isNotNull();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_datasourceWithSameNameAndPlugin_importedWithValidActionsWithoutSuffixedDatasource() {

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Duplicate datasource with same plugin org");
        testWorkspace = workspaceService.create(testWorkspace).block();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();
        Datasource testDatasource = new Datasource();
        // Chose plugin same as mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("MongoDB").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        testDatasource.setDatasourceStorages(storages);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(testWorkspace.getId(), applicationJson)
                .map(importableArtifact -> (Application) importableArtifact);

        StepVerifier.create(resultMono.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), MANAGE_DATASOURCES)
                                .collectList(),
                        newActionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();

                    assertThat(application.getName()).isEqualTo("valid_application");

                    List<String> datasourceNameList = new ArrayList<>();
                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getWorkspaceId()).isEqualTo(application.getWorkspaceId());
                        datasourceNameList.add(datasource.getName());
                    });
                    // Check that there are no datasources are created with suffix names as datasource's are of same
                    // plugin
                    assertThat(datasourceNameList).contains(datasourceName);

                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getDatasource()).isNotNull();
                    });
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
                .exportByArtifactIdAndBranchName(testApplication.getId(), "", APPLICATION)
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
                .exportByArtifactId(savedApplication.getId(), VERSION_CONTROL, APPLICATION)
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
                .exportByArtifactId(savedApplication.getId(), VERSION_CONTROL, APPLICATION)
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
                .exportByArtifactIdAndBranchName(testApplication.getId(), "", APPLICATION)
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

    private ApplicationJson createApplicationJSON(List<String> pageNames) {
        ApplicationJson applicationJson = new ApplicationJson();

        // set the application data
        Application application = new Application();
        application.setName("Template Application");
        application.setSlug("template-application");
        application.setForkingEnabled(true);
        application.setIsPublic(true);
        application.setApplicationVersion(ApplicationVersion.LATEST_VERSION);
        applicationJson.setExportedApplication(application);

        DatasourceStorage sampleDatasource = new DatasourceStorage();
        sampleDatasource.setName("SampleDS");
        sampleDatasource.setPluginId("restapi-plugin");

        applicationJson.setDatasourceList(List.of(sampleDatasource));

        // add pages and actions
        List<NewPage> newPageList = new ArrayList<>(pageNames.size());
        List<NewAction> actionList = new ArrayList<>();
        List<ActionCollection> actionCollectionList = new ArrayList<>();

        for (String pageName : pageNames) {
            NewPage newPage = new NewPage();
            newPage.setUnpublishedPage(new PageDTO());
            newPage.getUnpublishedPage().setName(pageName);
            newPage.getUnpublishedPage().setLayouts(List.of());
            newPageList.add(newPage);

            NewAction action = new NewAction();
            action.setId(pageName + "_SampleQuery");
            action.setPluginType(PluginType.API);
            action.setPluginId("restapi-plugin");
            action.setUnpublishedAction(new ActionDTO());
            action.getUnpublishedAction().setName("SampleQuery");
            action.getUnpublishedAction().setPageId(pageName);
            action.getUnpublishedAction().setDatasource(new Datasource());
            action.getUnpublishedAction().getDatasource().setId("SampleDS");
            action.getUnpublishedAction().getDatasource().setPluginId("restapi-plugin");
            actionList.add(action);

            ActionCollection actionCollection = new ActionCollection();
            actionCollection.setId(pageName + "_SampleJS");
            actionCollection.setUnpublishedCollection(new ActionCollectionDTO());
            actionCollection.getUnpublishedCollection().setName("SampleJS");
            actionCollection.getUnpublishedCollection().setPageId(pageName);
            actionCollection.getUnpublishedCollection().setPluginId("js-plugin");
            actionCollection.getUnpublishedCollection().setPluginType(PluginType.JS);
            actionCollection.getUnpublishedCollection().setBody("export default {\\n\\t\\n}");
            actionCollectionList.add(actionCollection);
        }

        applicationJson.setPageList(newPageList);
        applicationJson.setActionList(actionList);
        applicationJson.setActionCollectionList(actionCollectionList);
        return applicationJson;
    }

    @Test
    @WithUserDetails("api_user")
    public void mergeApplicationJsonWithApplication_WhenPageNameConflicts_PageNamesRenamed() {
        String uniqueString = UUID.randomUUID().toString();

        Application destApplication = new Application();
        destApplication.setName("App_" + uniqueString);
        destApplication.setSlug("my-slug");
        destApplication.setIsPublic(false);
        destApplication.setForkingEnabled(false);
        Mono<Application> createAppAndPageMono = applicationPageService
                .createApplication(destApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono
        ApplicationJson applicationJson = createApplicationJSON(List.of("Home", "About"));

        Mono<Tuple3<ApplicationPagesDTO, List<NewAction>, List<ActionCollection>>> tuple2Mono = createAppAndPageMono
                .flatMap(application ->
                        // merge the application json with the application we've created
                        importService
                                .mergeArtifactExchangeJsonWithImportableArtifact(
                                        application.getWorkspaceId(), application.getId(), null, applicationJson, null)
                                .thenReturn(application))
                .flatMap(application ->
                        // fetch the application pages, this should contain pages from application json
                        Mono.zip(
                                newPageService.findApplicationPages(application.getId(), null, ApplicationMode.EDIT),
                                newActionService
                                        .findAllByApplicationIdAndViewMode(
                                                application.getId(), false, MANAGE_ACTIONS, null)
                                        .collectList(),
                                actionCollectionService
                                        .findAllByApplicationIdAndViewMode(
                                                application.getId(), false, MANAGE_ACTIONS, null)
                                        .collectList()));

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    ApplicationPagesDTO applicationPagesDTO = objects.getT1();
                    List<NewAction> newActionList = objects.getT2();
                    List<ActionCollection> actionCollectionList = objects.getT3();

                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo(destApplication.getName());
                    assertThat(applicationPagesDTO.getApplication().getSlug()).isEqualTo(destApplication.getSlug());
                    assertThat(applicationPagesDTO.getApplication().getIsPublic())
                            .isFalse();
                    assertThat(applicationPagesDTO.getApplication().getForkingEnabled())
                            .isFalse();
                    assertThat(applicationPagesDTO.getPages()).hasSize(4);
                    List<String> pageNames = applicationPagesDTO.getPages().stream()
                            .map(PageNameIdDTO::getName)
                            .collect(Collectors.toList());
                    assertThat(pageNames).contains("Home", "Home2", "About");
                    assertThat(newActionList).hasSize(2); // we imported two pages and each page has one action
                    assertThat(actionCollectionList)
                            .hasSize(2); // we imported two pages and each page has one Collection
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void mergeApplicationJsonWithApplication_WhenPageListIProvided_OnlyListedPagesAreMerged() {
        String uniqueString = UUID.randomUUID().toString();

        Application destApplication = new Application();
        destApplication.setName("App_" + uniqueString);
        Mono<Application> createAppAndPageMono = applicationPageService
                .createApplication(destApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono
        ApplicationJson applicationJson = createApplicationJSON(List.of("Profile", "About", "Contact US"));

        Mono<ApplicationPagesDTO> applicationPagesDTOMono = createAppAndPageMono
                .flatMap(application ->
                        // merge the application json with the application we've created
                        importService
                                .mergeArtifactExchangeJsonWithImportableArtifact(
                                        application.getWorkspaceId(),
                                        application.getId(),
                                        null,
                                        applicationJson,
                                        List.of("About", "Contact US"))
                                .thenReturn(application))
                .flatMap(application ->
                        // fetch the application pages, this should contain pages from application json
                        newPageService.findApplicationPages(application.getId(), null, ApplicationMode.EDIT));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getPages()).hasSize(4);
                    List<String> pageNames = applicationPagesDTO.getPages().stream()
                            .map(PageNameIdDTO::getName)
                            .collect(Collectors.toList());
                    assertThat(pageNames).contains("Home", "About", "Contact US");
                    assertThat(pageNames).doesNotContain("Profile");
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
                                    application.getId(), branchName, APPLICATION))
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
    public void importApplication_invalidPluginReferenceForDatasource_throwException() {
        Mockito.when(pluginService.findAllByIdsWithoutPermission(Mockito.anySet(), Mockito.anyList()))
                .thenReturn(Flux.fromIterable(List.of(installedPlugin, installedJsPlugin)));

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        ApplicationJson appJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json")
                .block();
        assert appJson != null;
        final String randomId = UUID.randomUUID().toString();
        appJson.getDatasourceList().get(0).setPluginId(randomId);
        Workspace createdWorkspace = workspaceService.create(newWorkspace).block();
        final Mono<Application> resultMono = importService
                .importNewArtifactInWorkspaceFromJson(createdWorkspace.getId(), appJson)
                .map(importableArtifact -> (Application) importableArtifact);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.GENERIC_JSON_IMPORT_ERROR.getMessage(
                                        createdWorkspace.getId(), "")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_importSameApplicationTwice_applicationImportedLaterWithSuffixCount() {

        Mono<ApplicationJson> applicationJsonMono =
                createAppJson("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> createWorkspaceMono =
                workspaceService.create(newWorkspace).cache();
        final Mono<Application> importApplicationMono = createWorkspaceMono
                .zipWith(applicationJsonMono)
                .flatMap(tuple -> {
                    Workspace workspace = tuple.getT1();
                    ApplicationJson applicationJson = tuple.getT2();
                    return importService
                            .importNewArtifactInWorkspaceFromJson(workspace.getId(), applicationJson)
                            .map(importableArtifact -> (Application) importableArtifact);
                });

        StepVerifier.create(importApplicationMono.zipWhen(application -> importApplicationMono))
                .assertNext(tuple -> {
                    Application firstImportedApplication = tuple.getT1();
                    Application secondImportedApplication = tuple.getT2();
                    assertThat(firstImportedApplication.getName()).isEqualTo("valid_application");
                    assertThat(secondImportedApplication.getName()).isEqualTo("valid_application (1)");
                    assertThat(firstImportedApplication.getWorkspaceId())
                            .isEqualTo(secondImportedApplication.getWorkspaceId());
                    assertThat(firstImportedApplication.getWorkspaceId()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_existingApplication_pageAddedSuccessfully() {

        // Create application
        Application application = new Application();
        application.setName("mergeApplication_existingApplication_pageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, finalApplication.getId(), null, applicationJson1, new ArrayList<>()))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application1 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplication_pageAddedSuccessfully() {

        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplication_pageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, finalApplication.getId(), "master", applicationJson1, new ArrayList<>()))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application1 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully() {

        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData1 = new GitArtifactMetadata();
        gitData1.setRefName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                })
                .block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, branchApp.getId(), "feature", applicationJson1, new ArrayList<>()))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application2 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully() {
        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName(
                "mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName(
                "mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData1 = new GitArtifactMetadata();
        gitData1.setRefName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                })
                .block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, branchApp.getId(), "feature", applicationJson1, List.of("Page1")))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application2 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully() {
        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName(
                "mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName(
                "mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData1 = new GitArtifactMetadata();
        gitData1.setRefName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                })
                .block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, branchApp.getId(), "feature", applicationJson1, List.of("Page1", "Page2")))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application2 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_nonGitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully() {
        // Create application
        Application application = new Application();
        application.setName(
                "mergeApplication_nonGitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId, finalApplication.getId(), null, applicationJson1, List.of("Page1")))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application1 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getUnpublishedCustomJSLibs().size()).isEqualTo(2);
                    List<String> uidNameList = application1.getUnpublishedCustomJSLibs().stream()
                            .map(CustomJSLibContextDTO::getUidString)
                            .toList();
                    assertThat(uidNameList)
                            .containsAll(
                                    List.of(
                                            "accessor1_url",
                                            "xmlParser_https://cdnjs.cloudflare.com/ajax/libs/fast-xml-parser/3.17.5/parser.min.js"));

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_nonGitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully() {
        // Create application
        Application application = new Application();
        application.setName(
                "mergeApplication_nonGitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationJson
                        .flatMap(applicationJson1 -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                workspaceId,
                                finalApplication.getId(),
                                null,
                                applicationJson1,
                                List.of("Page1", "Page2")))
                        .map(importableArtifact -> (Application) importableArtifact)
                        .flatMap(application1 -> {
                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(
                                            application1.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size())
                            .isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages())
                            .hasSize(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream()
                            .filter(newPage ->
                                    newPage.getUnpublishedPage().getName().equals("Page12"))
                            .collect(Collectors.toList())
                            .get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName())
                                .containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName())
                                .containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId())
                                .isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_invalidJson_createdAppIsDeleted() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-pages.json");

        List<Application> applicationList = applicationService
                .findAllApplicationsByWorkspaceId(workspaceId)
                .collectList()
                .block();

        Mono<ApplicationImportDTO> resultMono = importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, null)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.VALIDATION_FAILURE.getMessage(
                                        "Field '" + FieldName.PAGE_LIST + "' is missing in the JSON.")))
                .verify();

        // Verify that the app card is not created
        StepVerifier.create(applicationService
                        .findAllApplicationsByWorkspaceId(workspaceId)
                        .collectList())
                .assertNext(applications -> {
                    assertThat(applicationList).hasSize(applications.size());
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
                                    objects.getT1().getId(), "", APPLICATION))
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
                .exportByArtifactIdAndBranchName(createdApplication.getId(), "", APPLICATION)
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
                .exportByArtifactIdAndBranchName(applicationPageDTO.getApplicationId(), "", APPLICATION)
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
    public void importApplication_existingApplication_ApplicationReplacedWithImportedOne() {
        String randomUUID = UUID.randomUUID().toString();
        Mono<ApplicationJson> applicationJson =
                createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        // Create the initial application
        Application application = new Application();
        application.setName("Application_" + randomUUID);
        application.setWorkspaceId(workspaceId);

        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication =
                applicationPageService
                        .createApplication(application)
                        .flatMap(createdApp -> {
                            PageDTO pageDTO = new PageDTO();
                            pageDTO.setApplicationId(application.getId());
                            pageDTO.setName("Home Page");
                            return applicationPageService.createPage(pageDTO).thenReturn(createdApp);
                        })
                        .zipWith(applicationJson)
                        .flatMap(objects -> importService
                                .restoreSnapshot(workspaceId, objects.getT1().getId(), objects.getT2())
                                .map(importableArtifact -> (Application) importableArtifact)
                                .zipWith(Mono.just(objects.getT1())))
                        .flatMap(objects -> {
                            Application newApp = objects.getT1();
                            Application oldApp = objects.getT2();
                            // after import, application id should not change
                            assert Objects.equals(newApp.getId(), oldApp.getId());

                            Mono<List<NewPage>> pageList = newPageService
                                    .findNewPagesByApplicationId(newApp.getId(), MANAGE_PAGES)
                                    .collectList();
                            Mono<List<NewAction>> actionList = newActionService
                                    .findAllByApplicationIdAndViewMode(newApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                                    .findAllByApplicationIdAndViewMode(newApp.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList();
                            return Mono.zip(Mono.just(newApp), pageList, actionList, actionCollectionList);
                        });

        StepVerifier.create(importedApplication)
                .assertNext(tuple -> {
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(pageList).hasSize(2);
                    assertThat(actionList).hasSize(3);

                    List<String> pageNames = pageList.stream()
                            .map(p -> p.getUnpublishedPage().getName())
                            .collect(Collectors.toList());

                    List<String> actionNames = actionList.stream()
                            .map(p -> p.getUnpublishedAction().getName())
                            .collect(Collectors.toList());

                    List<String> actionCollectionNames = actionCollectionList.stream()
                            .map(p -> p.getUnpublishedCollection().getName())
                            .collect(Collectors.toList());

                    // Verify the pages after importing the application
                    assertThat(pageNames).contains("Page1", "Page2");

                    // Verify the actions after importing the application
                    assertThat(actionNames).contains("api_wo_auth", "get_users", "run");

                    // Verify the actionCollections after importing the application
                    assertThat(actionCollectionNames).contains("JSObject1", "JSObject2");
                })
                .verifyComplete();
    }

    /**
     * Testcase for updating the existing application:
     * 1. Import application in org
     * 2. Add new page to the imported application
     * 3. User tries to import application from same application json file
     * 4. Added page will be removed
     * <p>
     * We don't have to test all the flows for other resources like actions, JSObjects, themes as these are already
     * covered as a part of discard functionality
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void extractFileAndUpdateApplication_addNewPageAfterImport_addedPageRemoved() {

        /*
        1. Import application
        2. Add single page to imported app
        3. Import the application from same JSON with applicationId
        4. Added page should be deleted from DB
         */

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, null)
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO)
                .flatMap(applicationImportDTO -> {
                    PageDTO page = new PageDTO();
                    page.setName("discard-page-test");
                    page.setApplicationId(applicationImportDTO.getApplication().getId());
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationRepository.findById(page.getApplicationId()))
                .cache();

        StepVerifier.create(resultMonoWithoutDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("valid_application");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(3);
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNull();

                    assertThat(pageList).hasSize(3);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions())
                            .isNotEmpty();

                    List<String> pageNames = new ArrayList<>();
                    pageList.forEach(page -> pageNames.add(page.getName()));
                    assertThat(pageNames).contains("discard-page-test");
                })
                .verifyComplete();

        // Import the same application again to find if the added page is deleted
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication -> applicationService.save(importedApplication))
                .flatMap(savedApplication -> importService.extractArtifactExchangeJsonAndSaveArtifact(
                        filePart, workspaceId, savedApplication.getId()))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO)
                .map(ApplicationImportDTO::getApplication);

        StepVerifier.create(resultMonoWithDiscardOperation.flatMap(application -> Mono.zip(
                        Mono.just(application),
                        newPageService
                                .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                .collectList())))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<PageDTO> pageList = tuple.getT2();

                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPublishedPages()).hasSize(1);

                    assertThat(pageList).hasSize(2);

                    List<String> pageNames = new ArrayList<>();
                    pageList.forEach(page -> pageNames.add(page.getName()));
                    assertThat(pageNames).doesNotContain("discard-page-test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void extractFileAndUpdateExistingApplication_gitConnectedApplication_throwUnsupportedOperationException() {

        /*
        1. Create application and mock git connectivity
        2. Import the application from valid JSON with saved applicationId
        3. Unsupported operation exception should be thrown
         */

        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName(
                "extractFileAndUpdateExistingApplication_gitConnectedApplication_throwUnsupportedOperationException");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRemoteUrl("git@example.com:username/git-repo.git");
        testApplication.setGitApplicationMetadata(gitData);
        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
        final Mono<ApplicationImportDTO> resultMono = importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, application.getId())
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(
                                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION
                                                .getMessage()))
                .verify();
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
                .then(exportService.exportByArtifactIdAndBranchName(testAppId, "", APPLICATION))
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

    @Test
    @WithUserDetails(value = "api_user")
    public void extractFileAndUpdateExistingApplication_existingApplication_applicationNameAndSlugRemainsUnchanged() {

        /*
        1. Create application
        2. Import the application from valid JSON with saved applicationId
        3. Name and slug will not be updated by the incoming changes from the json file
         */

        Application testApplication = new Application();
        final String appName = UUID.randomUUID().toString();
        testApplication.setName(appName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
        final Mono<ApplicationImportDTO> resultMono = importService
                .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, application.getId())
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .assertNext(applicationImportDTO -> {
                    Application application1 = applicationImportDTO.getApplication();
                    assertThat(application1.getName()).isEqualTo(appName);
                    assertThat(application1.getSlug()).isEqualTo(appName);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplicationJsonWithApplication_WhenNoPermissionToCreatePage_Fails() {
        Application testApplication = new Application();
        final String appName = UUID.randomUUID().toString();
        testApplication.setName(appName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());

        Mono<Application> applicationImportDTOMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    // remove page create permission from this application for current user
                    application.setPolicies(application.getPolicies().stream()
                            .filter(policy -> !policy.getPermission()
                                    .equals(applicationPermission
                                            .getPageCreatePermission()
                                            .getValue()))
                            .collect(Collectors.toUnmodifiableSet()));
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    final String validAppJsonContents =
                            readResource("test_assets/ImportExportServiceTest/valid-application.json");
                    return importService
                            .extractArtifactExchangeJson(validAppJsonContents)
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                            .flatMap(applicationJson -> importService.mergeArtifactExchangeJsonWithImportableArtifact(
                                    workspaceId, application.getId(), null, applicationJson, null))
                            .map(importableArtifact -> (Application) importableArtifact);
                });

        StepVerifier.create(applicationImportDTOMono)
                .expectError(AppsmithException.class)
                .verify();
    }

    @SneakyThrows
    private String readResource(String filePath) {
        return StreamUtils.copyToString(
                new DefaultResourceLoader().getResource(filePath).getInputStream(), StandardCharsets.UTF_8);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void extractFileAndUpdateNonGitConnectedApplication_WhenNoPermissionToCreatePage_Fails() {
        Application testApplication = new Application();
        final String appName = UUID.randomUUID().toString();
        testApplication.setName(appName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());

        Mono<ApplicationImportDTO> applicationImportDTOMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    // remove page create permission from this application for current user
                    application.setPolicies(application.getPolicies().stream()
                            .filter(policy -> !policy.getPermission()
                                    .equals(applicationPermission
                                            .getPageCreatePermission()
                                            .getValue()))
                            .collect(Collectors.toUnmodifiableSet()));
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");
                    return importService
                            .extractArtifactExchangeJsonAndSaveArtifact(filePart, workspaceId, application.getId())
                            .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);
                });

        StepVerifier.create(applicationImportDTOMono)
                .expectError(AppsmithException.class)
                .verify();
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
                            .then(exportService.exportByArtifactId(application.getId(), VERSION_CONTROL, APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        // verify that the exported json has the updated page name, and the queries are in the updated resources
        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    ModifiedResources modifiedResources = applicationJson.getModifiedResources();
                    assertThat(modifiedResources).isNotNull();
                    Set<String> updatedPageNames =
                            modifiedResources.getModifiedResourceMap().get(FieldName.PAGE_LIST);
                    Set<String> updatedActionNames =
                            modifiedResources.getModifiedResourceMap().get(FieldName.ACTION_LIST);
                    Set<String> updatedActionCollectionNames =
                            modifiedResources.getModifiedResourceMap().get(FieldName.ACTION_COLLECTION_LIST);

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
                            .then(exportService.exportByArtifactId(application.getId(), VERSION_CONTROL, APPLICATION))
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
                });

        // verify that the exported json has the updated page name, and the queries are in the updated resources
        StepVerifier.create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    ModifiedResources modifiedResources = applicationJson.getModifiedResources();
                    assertThat(modifiedResources).isNotNull();
                    Set<String> updatedActionNames =
                            modifiedResources.getModifiedResourceMap().get(FieldName.ACTION_LIST);
                    assertThat(updatedActionNames).isNotNull();

                    // action should be present in the updated resources although action not updated but datasource is
                    assertThat(updatedActionNames).hasSize(1);
                    updatedActionNames.forEach(actionName -> {
                        assertThat(actionName).contains("MyAction");
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_WhenUpdateLayoutFailures_Success() throws URISyntaxException {
        FilePart filePart = createFilePartWithIdenticalPackageStructure("faulty-dsl.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService.create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(filePart, workspace.getId(), null))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        List<PermissionGroup> permissionGroups = workspaceMono
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

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        StepVerifier.create(resultMono.flatMap(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    return Mono.zip(
                            Mono.just(applicationImportDTO),
                            datasourceService
                                    .getAllByWorkspaceIdWithStorages(application.getWorkspaceId(), MANAGE_DATASOURCES)
                                    .collectList(),
                            newActionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                    .collectList(),
                            newPageService
                                    .findByApplicationId(application.getId(), MANAGE_PAGES, false)
                                    .collectList(),
                            actionCollectionService
                                    .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null)
                                    .collectList(),
                            applicationService.findById(
                                    applicationImportDTO.getApplication().getId(), MANAGE_APPLICATIONS));
                }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT6();
                    final List<Datasource> unConfiguredDatasourceList =
                            tuple.getT1().getUnConfiguredDatasourceList();
                    final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("faultDSL");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(0);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNull();
                    assertThat(isPartialImport).isEqualTo(Boolean.TRUE);
                    assertThat(unConfiguredDatasourceList.size()).isNotEqualTo(0);

                    assertThat(datasourceList).isNotEmpty();
                    List<String> datasourceNames = unConfiguredDatasourceList.stream()
                            .map(Datasource::getName)
                            .collect(Collectors.toList());
                    assertThat(datasourceNames).contains("Mock_DB");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getPageId())
                                .isNotEqualTo(pageList.get(0).getName());
                        if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                            collectionIdInAction.add(actionDTO.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).isNotEmpty();
                    assertThat(actionCollectionList).hasSize(1);
                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages().stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId()))
                            .findFirst()
                            .orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                })
                .verifyComplete();
    }

    // this would be the newer way to create the fileParts
    private FilePart createFilePartWithIdenticalPackageStructure(String filePath) throws URISyntaxException {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        URL resource = this.getClass().getResource(filePath);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        Path.of(resource.toURI()), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }
}
