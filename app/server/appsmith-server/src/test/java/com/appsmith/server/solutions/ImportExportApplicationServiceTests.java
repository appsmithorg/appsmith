package com.appsmith.server.solutions;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.assertj.core.api.AbstractBigDecimalAssert;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;

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

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@TestMethodOrder(MethodOrderer.MethodName.class)
public class ImportExportApplicationServiceTests {

    @Autowired
    ImportExportApplicationService importExportApplicationService;

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

    private static final String INVALID_JSON_FILE = "invalid json file";
    private static Plugin installedPlugin;
    private static String workspaceId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;
    private static String exportWithConfigurationAppId;

    @BeforeEach
    public void setup() {
        Mockito
                .when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (Boolean.TRUE.equals(isSetupDone)) {
            return;
        }
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        Workspace workspace = new Workspace();
        workspace.setName("Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();

        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());

        Application savedApplication = applicationPageService.createApplication(testApplication, workspaceId).block();
        testAppId = savedApplication.getId();

        Datasource ds1 = new Datasource();
        ds1.setName("DS1");
        ds1.setWorkspaceId(workspaceId);
        ds1.setPluginId(installedPlugin.getId());
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://httpbin.org/get");
        datasourceConfiguration.setHeaders(List.of(
                new Property("X-Answer", "42")
        ));
        ds1.setDatasourceConfiguration(datasourceConfiguration);

        Datasource ds2 = new Datasource();
        ds2.setName("DS2");
        ds2.setPluginId(installedPlugin.getId());
        ds2.setDatasourceConfiguration(new DatasourceConfiguration());
        ds2.setWorkspaceId(workspaceId);
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        ds2.getDatasourceConfiguration().setAuthentication(auth);

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS datasource");
        jsDatasource.setWorkspaceId(workspaceId);
        installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
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
                .flatMap(page -> newActionService.getUnpublishedActions(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId()))), ""));
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(
                        new ClassPathResource(filePath),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;

    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = createFilePart(filePath);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        return stringifiedFile
                .map(data -> {
                    Gson gson = new Gson();
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .map(JsonSchemaMigration::migrateApplicationToLatestSchema);
    }

    private Workspace createTemplateWorkspace() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        return workspaceService.create(newWorkspace).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationWithNullApplicationIdTest() {
        Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(null, "");

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportPublicApplicationTest() {

        Application application = new Application();
        application.setName("exportPublicApplicationTest-Test");

        Application createdApplication = applicationPageService.createApplication(application, workspaceId).block();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        // Make the application public
        applicationService.changeViewAccess(createdApplication.getId(), applicationAccessDTO).block();

        Mono<ApplicationJson> resultMono =
                importExportApplicationService.exportApplicationById(createdApplication.getId(), "");

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication).isNotNull();
                    // Assert that the exported application is NOT public
                    assertThat(exportedApplication.getDefaultPermissionGroup()).isNull();
                    assertThat(exportedApplication.getPolicies()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplication_withInvalidApplicationId_throwNoResourceFoundException() {
        Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById("invalidAppId", "");

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION_ID, "invalidAppId")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenContainsInternalFields_InternalFieldsNotExported() {
        Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(testAppId, "");

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication.getModifiedBy()).isNull();
                    assertThat(exportedApplication.getLastUpdateTime()).isNull();
                    assertThat(exportedApplication.getLastEditedAt()).isNull();
                    assertThat(exportedApplication.getLastDeployedAt()).isNull();
                    assertThat(exportedApplication.getGitApplicationMetadata()).isNull();
                    assertThat(exportedApplication.getEditModeThemeId()).isNull();
                    assertThat(exportedApplication.getPublishedModeThemeId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithDatasourceButWithoutActionsTest() {

        Application testApplication = new Application();
        testApplication.setName("Another Export Application");

        final Mono<ApplicationJson> resultMono = workspaceService.getById(workspaceId)
                .flatMap(workspace -> {

                    final Datasource ds1 = datasourceMap.get("DS1");
                    ds1.setWorkspaceId(workspace.getId());

                    final Datasource ds2 = datasourceMap.get("DS2");
                    ds2.setWorkspaceId(workspace.getId());

                    return applicationPageService.createApplication(testApplication, workspaceId);
                })
                .flatMap(application -> importExportApplicationService.exportApplicationById(application.getId(), ""));

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
        testApplication = applicationPageService.createApplication(testApplication, workspaceId).block();

        assert testApplication != null;
        final String appName = testApplication.getName();
        final Mono<ApplicationJson> resultMono = Mono.zip(
                        Mono.just(testApplication),
                        newPageService.findPageById(testApplication.getPages().get(0).getId(), READ_PAGES, false)
                )
                .flatMap(tuple -> {
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    Layout layout = testPage.getLayouts().get(0);
                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject dsl = new JSONObject();
                    try {
                        dsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                    }

                    ArrayList children = (ArrayList) dsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
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
                    temp2.addAll(List.of(new JSONObject(Map.of("key", "primaryColumns._id"))));
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

                    return layoutCollectionService.createCollection(actionCollectionDTO1)
                            .then(layoutActionService.createSingleAction(action))
                            .then(layoutActionService.createSingleAction(action2))
                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout))
                            .then(importExportApplicationService.exportApplicationById(testApp.getId(), ""));
                })
                .cache();

        Mono<List<NewAction>> actionListMono = resultMono
                .then(newActionService
                        .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null).collectList());

        Mono<List<ActionCollection>> collectionListMono = resultMono.then(
                actionCollectionService
                        .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null).collectList());

        Mono<List<NewPage>> pageListMono = resultMono.then(
                newPageService
                        .findNewPagesByApplicationId(testApplication.getId(), READ_PAGES).collectList());

        StepVerifier
                .create(Mono.zip(resultMono, actionListMono, collectionListMono, pageListMono))
                .assertNext(tuple -> {

                    ApplicationJson applicationJson = tuple.getT1();
                    List<NewAction> DBActions = tuple.getT2();
                    List<ActionCollection> DBCollections = tuple.getT3();
                    List<NewPage> DBPages = tuple.getT4();

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<ActionCollection> actionCollectionList = applicationJson.getActionCollectionList();
                    List<Datasource> datasourceList = applicationJson.getDatasourceList();

                    List<String> exportedCollectionIds = actionCollectionList.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> exportedActionIds = actionList.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBCollectionIds = DBCollections.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> DBActionIds = DBActions.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBOnLayoutLoadActionIds = new ArrayList<>();
                    List<String> exportedOnLayoutLoadActionIds = new ArrayList<>();

                    assertThat(DBPages).hasSize(1);
                    DBPages.forEach(newPage ->
                            newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(actionDTO -> DBOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            })
                    );
                    pageList.forEach(newPage ->
                            newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(actionDTO -> exportedOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            })
                    );

                    NewPage defaultPage = pageList.get(0);

                    // Check if the mongo escaped widget names are carried to exported file from DB
                    Layout pageLayout = DBPages.get(0).getUnpublishedPage().getLayouts().get(0);
                    Set<String> mongoEscapedWidgets = pageLayout.getMongoEscapedWidgetNames();
                    Set<String> expectedMongoEscapedWidgets = Set.of("Table1");
                    assertThat(mongoEscapedWidgets).isEqualTo(expectedMongoEscapedWidgets);

                    pageLayout = pageList.get(0).getUnpublishedPage().getLayouts().get(0);
                    Set<String> exportedMongoEscapedWidgets = pageLayout.getMongoEscapedWidgetNames();
                    assertThat(exportedMongoEscapedWidgets).isEqualTo(expectedMongoEscapedWidgets);


                    assertThat(exportedApp.getName()).isEqualTo(appName);
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    assertThat(exportedApp.getPages().get(0).getId()).isEqualTo(defaultPage.getUnpublishedPage().getName());

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isNull();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream().filter(action -> action.getId().equals("Page1_validAction")).findFirst().get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getWorkspaceId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    ActionDTO unpublishedAction = validAction.getUnpublishedAction();
                    assertThat(unpublishedAction.getPageId()).isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(unpublishedAction.getDatasource().getPluginId()).isEqualTo(installedPlugin.getPackageName());

                    NewAction testAction1 = actionList.stream().filter(action -> action.getUnpublishedAction().getName().equals("testAction1")).findFirst().get();
                    assertThat(testAction1.getId()).isEqualTo("Page1_testCollection1.testAction1");

                    assertThat(actionCollectionList.isEmpty()).isFalse();
                    assertThat(actionCollectionList).hasSize(1);
                    final ActionCollection actionCollection = actionCollectionList.get(0);
                    assertThat(actionCollection.getApplicationId()).isNull();
                    assertThat(actionCollection.getWorkspaceId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType()).isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId()).isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    Datasource datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNull();

                    assertThat(applicationJson.getInvisibleActionFields()).isNull();
                    NewAction validAction2 = actionList.stream().filter(action -> action.getId().equals("Page1_validAction2")).findFirst().get();
                    assertEquals(true, validAction2.getUnpublishedAction().getUserSetOnLoad());

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNull();
                    assertThat(applicationJson.getEditModeTheme()).isNotNull();
                    assertThat(applicationJson.getEditModeTheme().isSystemTheme()).isTrue();
                    assertThat(applicationJson.getEditModeTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(applicationJson.getPublishedTheme()).isNotNull();
                    assertThat(applicationJson.getPublishedTheme().isSystemTheme()).isTrue();
                    assertThat(applicationJson.getPublishedTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

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
        final Mono<ApplicationJson> resultMono = applicationRepository.findById(testAppId)
                .flatMap(testApp -> {
                    final String pageId = testApp.getPages().get(0).getId();
                    return Mono.zip(
                            Mono.just(testApp),
                            newPageService.findPageById(pageId, READ_PAGES, false)
                    );
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

                    return layoutActionService.createAction(action)
                            .then(importExportApplicationService.exportApplicationById(testApp.getId(), SerialiseApplicationObjective.VERSION_CONTROL));
                });

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson -> {

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<Datasource> datasourceList = applicationJson.getDatasourceList();

                    NewPage newPage = pageList.get(0);

                    assertThat(applicationJson.getServerSchemaVersion()).isEqualTo(JsonSchemaVersions.serverVersion);
                    assertThat(applicationJson.getClientSchemaVersion()).isEqualTo(JsonSchemaVersions.clientVersion);

                    assertThat(exportedApp.getName()).isNotNull();
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    assertThat(exportedApp.getPages().get(0).getId()).isEqualTo(pageName.toString());
                    assertThat(exportedApp.getGitApplicationMetadata()).isNull();

                    assertThat(exportedApp.getPolicies()).isNull();
                    assertThat(exportedApp.getUserPermissions()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(newPage.getApplicationId()).isNull();
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
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
                    Datasource datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNull();

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromInvalidFileTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(workspaceId, filepart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationWithNullWorkspaceIdTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);

        Mono<ApplicationImportDTO> resultMono = importExportApplicationService
                .extractFileAndSaveApplication(null, filepart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromInvalidJsonFileWithoutPagesTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-pages.json");
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(workspaceId, filePart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PAGES, INVALID_JSON_FILE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromInvalidJsonFileWithoutApplicationTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-app.json");
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(workspaceId, filePart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, INVALID_JSON_FILE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromValidJsonFileTest() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService
                .create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        List<PermissionGroup> permissionGroups = workspaceMono
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(),
                        viewerPermissionGroup.getId()))
                .build();

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> {
                            Application application = applicationImportDTO.getApplication();
                            return Mono.zip(
                                    Mono.just(applicationImportDTO),
                                    datasourceService.findAllByWorkspaceId(application.getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                    newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                    newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                                    actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                            );
                        }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> unConfiguredDatasourceList = tuple.getT1().getUnConfiguredDatasourceList();
                    final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("valid_application");
                    assertThat(application.getWorkspaceId()).isNotNull();
                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEditModeThemeId()).isNotNull();
                    assertThat(application.getPublishedModeThemeId()).isNotNull();
                    assertThat(isPartialImport).isEqualTo(Boolean.TRUE);
                    assertThat(unConfiguredDatasourceList).isNotNull();

                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getWorkspaceId()).isEqualTo(application.getWorkspaceId());
                        assertThat(datasource.getDatasourceConfiguration()).isNotNull();
                    });

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getPageId()).isNotEqualTo(pageList.get(0).getName());
                        if (StringUtils.equals(actionDTO.getName(), "api_wo_auth")) {
                            ActionDTO publishedAction = newAction.getPublishedAction();
                            assertThat(publishedAction).isNotNull();
                            assertThat(publishedAction.getActionConfiguration()).isNotNull();
                            // Test the fallback page ID from the unpublishedAction is copied to published version when
                            // published version does not have pageId
                            assertThat(actionDTO.getPageId()).isEqualTo(publishedAction.getPageId());
                        }
                        if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                            collectionIdInAction.add(actionDTO.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).isNotEmpty();
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getUnpublishedCollection().getPageId()).isNotEqualTo(pageList.get(0).getName());
                        if (StringUtils.equals(actionCollection.getUnpublishedCollection().getName(), "JSObject2")) {
                            // Check if this action collection is not attached to any action
                            assertThat(collectionIdInAction).doesNotContain(actionCollection.getId());
                        } else {
                            assertThat(collectionIdInAction).contains(actionCollection.getId());
                        }
                    });

                    assertThat(pageList).hasSize(2);

                    ApplicationPage defaultAppPage = application.getPages()
                            .stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId())).findFirst().orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions()).isNotEmpty();
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

        importExportApplicationService
                .extractFileAndSaveApplication(newWorkspace.getId(), filePart)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for import to complete
        Mono<Application> importedAppFromDbMono = Mono.just(newWorkspace)
                .flatMap(workspace -> {
                    try {
                        // Before fetching the imported application, sleep for 5 seconds to ensure that the import completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository.findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
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
        FilePart filePart = createFilePart(
                "test_assets/ImportExportServiceTest/valid-application-with-custom-themes.json"
        );

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Import theme test org");

        final Mono<ApplicationImportDTO> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> Mono.zip(
                                Mono.just(applicationImportDTO),
                                themeRepository.findById(applicationImportDTO.getApplication().getEditModeThemeId()),
                                themeRepository.findById(applicationImportDTO.getApplication().getPublishedModeThemeId())
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    Theme editTheme = tuple.getT2();
                    Theme publishedTheme = tuple.getT3();

                    assertThat(editTheme.isSystemTheme()).isFalse();
                    assertThat(editTheme.getDisplayName()).isEqualTo("Custom edit theme");
                    assertThat(editTheme.getWorkspaceId()).isNull();
                    assertThat(editTheme.getApplicationId()).isNull();

                    assertThat(publishedTheme.isSystemTheme()).isFalse();
                    assertThat(publishedTheme.getDisplayName()).isEqualTo("Custom published theme");
                    assertThat(publishedTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(publishedTheme.getApplicationId()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withoutActionCollection_succeedsWithoutError() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService
                .create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        List<PermissionGroup> permissionGroups = workspaceMono
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(),
                        viewerPermissionGroup.getId()))
                .build();

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> Mono.zip(
                                Mono.just(applicationImportDTO),
                                datasourceService.findAllByWorkspaceId(applicationImportDTO.getApplication().getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                getActionsInApplication(applicationImportDTO.getApplication()).collectList(),
                                newPageService.findByApplicationId(applicationImportDTO.getApplication().getId(), MANAGE_PAGES, false).collectList(),
                                actionCollectionService.findAllByApplicationIdAndViewMode(applicationImportDTO.getApplication().getId(), false
                                        , MANAGE_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<ActionDTO> actionDTOS = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

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
                        assertThat(datasource.getDatasourceConfiguration()).isNotNull();
                    });

                    assertThat(actionDTOS).isNotEmpty();
                    actionDTOS.forEach(actionDTO -> {
                        assertThat(actionDTO.getPageId()).isNotEqualTo(pageList.get(0).getName());

                    });

                    assertThat(actionCollectionList).isEmpty();

                    assertThat(pageList).hasSize(2);

                    ApplicationPage defaultAppPage = application.getPages()
                            .stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId())).findFirst().orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_WithoutThemes_LegacyThemesAssigned() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application-without-theme.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        final Mono<ApplicationImportDTO> resultMono = workspaceService.create(newWorkspace)
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        StepVerifier
                .create(resultMono)
                .assertNext(applicationImportDTO -> {
                    assertThat(applicationImportDTO.getApplication().getEditModeThemeId()).isNotEmpty();
                    assertThat(applicationImportDTO.getApplication().getPublishedModeThemeId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withoutPageIdInActionCollection_succeeds() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-application-without-pageId-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        final Mono<ApplicationImportDTO> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> Mono.zip(
                                Mono.just(applicationImportDTO),
                                datasourceService.findAllByWorkspaceId(applicationImportDTO.getApplication().getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                getActionsInApplication(applicationImportDTO.getApplication()).collectList(),
                                newPageService.findByApplicationId(applicationImportDTO.getApplication().getId(), MANAGE_PAGES, false).collectList(),
                                actionCollectionService
                                        .findAllByApplicationIdAndViewMode(applicationImportDTO.getApplication().getId(), false, MANAGE_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<ActionDTO> actionDTOS = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();


                    assertThat(datasourceList).isNotEmpty();

                    assertThat(actionDTOS).hasSize(1);
                    actionDTOS.forEach(actionDTO -> {
                        assertThat(actionDTO.getPageId()).isNotEqualTo(pageList.get(0).getName());

                    });

                    assertThat(actionCollectionList).isEmpty();
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
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("testBranch");
        testApplication.setGitApplicationMetadata(gitData);

        Application savedApplication = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        Mono<Application> result = newPageService.findNewPagesByApplicationId(savedApplication.getId(), READ_PAGES).collectList()
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
                    return layoutActionService.createAction(action)
                            .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS));
                })
                .then(importExportApplicationService.exportApplicationById(savedApplication.getId(), SerialiseApplicationObjective.VERSION_CONTROL)
                        .flatMap(applicationJson -> importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson, savedApplication.getId(), gitData.getBranchName())))
                .cache();

        Mono<List<NewPage>> updatedPagesMono = result.then(newPageService.findNewPagesByApplicationId(savedApplication.getId(), READ_PAGES).collectList());

        Mono<List<NewAction>> updatedActionsMono = result.then(newActionService.findAllByApplicationIdAndViewMode(savedApplication.getId(), false, READ_PAGES, null).collectList());

        StepVerifier
                .create(Mono.zip(result, updatedPagesMono, updatedActionsMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();

                    final String branchName = application.getGitApplicationMetadata().getBranchName();
                    pageList.forEach(page -> {
                        assertThat(page.getDefaultResources()).isNotNull();
                        assertThat(page.getDefaultResources().getBranchName()).isEqualTo(branchName);
                    });

                    actionList.forEach(action -> {
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getBranchName()).isEqualTo(branchName);
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_incompatibleJsonFile_throwException() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/incompatible_version.json");
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(workspaceId, filePart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INCOMPATIBLE_IMPORTED_JSON.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withUnConfiguredDatasources_Success() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application-with-un-configured-datasource.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> workspaceMono = workspaceService
                .create(newWorkspace).cache();

        final Mono<ApplicationImportDTO> resultMono = workspaceMono
                .flatMap(workspace -> importExportApplicationService
                        .extractFileAndSaveApplication(workspace.getId(), filePart)
                );

        List<PermissionGroup> permissionGroups = workspaceMono
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(),
                        viewerPermissionGroup.getId()))
                .build();

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> {
                            Application application = applicationImportDTO.getApplication();
                            return Mono.zip(
                                    Mono.just(applicationImportDTO),
                                    datasourceService.findAllByWorkspaceId(application.getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                    newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                    newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                                    actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                            );
                        }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> unConfiguredDatasourceList = tuple.getT1().getUnConfiguredDatasourceList();
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
                    assertThat(application.getPublishedModeThemeId()).isNotNull();
                    assertThat(isPartialImport).isEqualTo(Boolean.TRUE);
                    assertThat(unConfiguredDatasourceList.size()).isNotEqualTo(0);

                    assertThat(datasourceList).isNotEmpty();
                    List<String> datasourceNames = unConfiguredDatasourceList.stream().map(Datasource::getName).collect(Collectors.toList());
                    assertThat(datasourceNames).contains("mongoDatasource", "postgresTest");

                    List<String> collectionIdInAction = new ArrayList<>();
                    assertThat(actionList).isNotEmpty();
                    actionList.forEach(newAction -> {
                        ActionDTO actionDTO = newAction.getUnpublishedAction();
                        assertThat(actionDTO.getPageId()).isNotEqualTo(pageList.get(0).getName());
                        if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                            collectionIdInAction.add(actionDTO.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).isEmpty();

                    assertThat(pageList).hasSize(1);

                    ApplicationPage defaultAppPage = application.getPages()
                            .stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId())).findFirst().orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                })
                .verifyComplete();
    }

    public void importApplicationIntoWorkspace_pageRemovedAndUpdatedDefaultPageNameInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoWorkspace_pageRemovedInBranchApplication_Success");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();
        String gitSyncIdBeforeImport = newPageService.findById(application.getPages().get(0).getId(), MANAGE_PAGES).block().getGitSyncId();

        PageDTO page = new PageDTO();
        page.setName("Page 2");
        page.setApplicationId(application.getId());
        PageDTO savedPage = applicationPageService.createPage(page).block();

        assert application.getId() != null;
        Set<String> applicationPageIdsBeforeImport = Objects.requireNonNull(applicationRepository.findById(application.getId()).block())
                .getPages()
                .stream()
                .map(ApplicationPage::getId)
                .collect(Collectors.toSet());

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application-with-page-removed.json").block();
        applicationJson.getPageList().get(0).setGitSyncId(gitSyncIdBeforeImport);

        Application importedApplication = importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson, application.getId(), "master").block();

        assert importedApplication != null;
        Mono<List<NewPage>> pageList = Flux.fromIterable(
                importedApplication
                        .getPages()
                        .stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toList())
        ).flatMap(s -> newPageService.findById(s, MANAGE_PAGES)).collectList();

        StepVerifier
                .create(pageList)
                .assertNext(newPages -> {
                    // Check before import we had both the pages
                    assertThat(applicationPageIdsBeforeImport).hasSize(2);
                    assertThat(applicationPageIdsBeforeImport).contains(savedPage.getId());

                    assertThat(newPages.size()).isEqualTo(1);
                    assertThat(importedApplication.getPages().size()).isEqualTo(1);
                    assertThat(importedApplication.getPages().get(0).getId()).isEqualTo(newPages.get(0).getId());
                    assertThat(newPages.get(0).getPublishedPage().getName()).isEqualTo("importedPage");
                    assertThat(newPages.get(0).getGitSyncId()).isEqualTo(gitSyncIdBeforeImport);

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationIntoWorkspace_pageAddedInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoWorkspace_pageAddedInBranchApplication_Success");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        String gitSyncIdBeforeImport = newPageService.findById(application.getPages().get(0).getId(), MANAGE_PAGES).block().getGitSyncId();

        assert application.getId() != null;
        Set<String> applicationPageIdsBeforeImport = Objects.requireNonNull(applicationRepository.findById(application.getId()).block())
                .getPages()
                .stream()
                .map(ApplicationPage::getId)
                .collect(Collectors.toSet());

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application-with-page-added.json").block();
        applicationJson.getPageList().get(0).setGitSyncId(gitSyncIdBeforeImport);

        Application applicationMono = importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson, application.getId(), "master").block();

        Mono<List<NewPage>> pageList = Flux.fromIterable(
                applicationMono.getPages()
                        .stream()
                        .map(ApplicationPage::getId)
                        .collect(Collectors.toList())
        ).flatMap(s -> newPageService.findById(s, MANAGE_PAGES)).collectList();

        StepVerifier
                .create(pageList)
                .assertNext(newPages -> {
                    // Check before import we had both the pages
                    assertThat(applicationPageIdsBeforeImport).hasSize(1);
                    assertThat(newPages.size()).isEqualTo(3);
                    List<String> pageNames = newPages.stream().map(newPage -> newPage.getUnpublishedPage().getName()).collect(Collectors.toList());
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

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, AclPermission.READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        Application testApplication = new Application();
        testApplication.setName("importUpdatedApplicationIntoWorkspaceFromFile_publicApplication_visibilityFlagNotReset");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Application newApplication = applicationService.changeViewAccess(application.getId(), "master", applicationAccessDTO).block();

        PermissionGroup anonymousPermissionGroup = permissionGroupService.getPublicPermissionGroup().block();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(),
                        viewerPermissionGroup.getId(), anonymousPermissionGroup.getId()))
                .build();

        Mono<Application> applicationMono = importExportApplicationService.exportApplicationById(application.getId(), "master")
                .flatMap(applicationJson -> importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson, application.getId(), "master"));

        StepVerifier
                .create(applicationMono)
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
        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-added");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("discard-page-test");
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationRepository.findById(page.getApplicationId()))
                .cache();

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList()
                        )))
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
                    assertThat(application.getPublishedModeThemeId()).isNotNull();

                    assertThat(pageList).hasSize(3);

                    ApplicationPage defaultAppPage = application.getPages()
                            .stream()
                            .filter(ApplicationPage::getIsDefault)
                            .findFirst()
                            .orElse(null);
                    assertThat(defaultAppPage).isNotNull();

                    PageDTO defaultPageDTO = pageList.stream()
                            .filter(pageDTO -> pageDTO.getId().equals(defaultAppPage.getId())).findFirst().orElse(null);

                    assertThat(defaultPageDTO).isNotNull();
                    assertThat(defaultPageDTO.getLayouts().get(0).getLayoutOnLoadActions()).isNotEmpty();

                    List<String> pageNames = new ArrayList<>();
                    pageList.forEach(page -> pageNames.add(page.getName()));
                    assertThat(pageNames).contains("discard-page-test");
                })
                .verifyComplete();

        // Import the same application again to find if the added page is deleted
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson ->
                                        {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList()
                        )))
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

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();

        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-added");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
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
                .flatMap(actionDTO -> newActionService.getById(actionDTO.getId()))
                .flatMap(newAction -> applicationRepository.findById(newAction.getApplicationId()))
                .cache();

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                getActionsInApplication(application).collectList()
                        )))
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
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson -> {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                getActionsInApplication(application).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionDTO> actionList = tuple.getT2();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).doesNotContain("discard-action-test");
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

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-added");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
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
                .flatMap(actionCollectionDTO -> actionCollectionService.getById(actionCollectionDTO.getId()))
                .flatMap(actionCollection -> applicationRepository.findById(actionCollection.getApplicationId()))
                .cache();

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                getActionsInApplication(application).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();
                    final List<ActionDTO> actionList = tuple.getT3();

                    assertThat(application.getName()).isEqualTo("discard-change-collection-added");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).contains("discard-action-collection-test");

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).contains("discard-action-collection-test-action");
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson ->
                                        {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                getActionsInApplication(application).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();
                    final List<ActionDTO> actionList = tuple.getT3();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).doesNotContain("discard-action-collection-test");

                    List<String> actionNames = new ArrayList<>();
                    actionList.forEach(actionDTO -> actionNames.add(actionDTO.getName()));
                    assertThat(actionNames).doesNotContain("discard-action-collection-test-action");
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

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-removed");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
                })
                .flatMap(application -> {
                    Optional<ApplicationPage> applicationPage = application
                            .getPages()
                            .stream()
                            .filter(page -> !page.isDefault())
                            .findFirst();
                    return applicationPageService.deleteUnpublishedPage(applicationPage.get().getId());
                })
                .flatMap(page -> applicationRepository.findById(page.getApplicationId()))
                .cache();

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList()
                        )))
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
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson ->
                                        {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList()
                        )))
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

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final String[] deletedActionName = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-removed");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
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

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                getActionsInApplication(application).collectList()
                        )))
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
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson ->
                                        {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                getActionsInApplication(application).collectList()
                        )))
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

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");
        String workspaceId = createTemplateWorkspace().getId();
        final String[] deletedActionCollectionNames = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-removed");
                    return importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson);
                })
                .flatMap(application -> {
                    return actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                            .next()
                            .flatMap(actionCollection -> {
                                deletedActionCollectionNames[0] = actionCollection.getUnpublishedCollection().getName();
                                return actionCollectionService.deleteUnpublishedActionCollection(actionCollection.getId());
                            })
                            .then(applicationPageService.publish(application.getId(), true));
                })
                .cache();

        StepVerifier
                .create(resultMonoWithoutDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();

                    assertThat(application.getName()).isEqualTo("discard-change-collection-removed");
                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).doesNotContain(deletedActionCollectionNames);
                })
                .verifyComplete();

        // Import the same application again
        final Mono<Application> resultMonoWithDiscardOperation = resultMonoWithoutDiscardOperation
                .flatMap(importedApplication ->
                        applicationJsonMono
                                .flatMap(applicationJson ->
                                        {
                                            importedApplication.setGitApplicationMetadata(new GitApplicationMetadata());
                                            importedApplication.getGitApplicationMetadata().setDefaultApplicationId(importedApplication.getId());
                                            return applicationService.save(importedApplication)
                                                    .then(importExportApplicationService.importApplicationInWorkspace(
                                                            importedApplication.getWorkspaceId(),
                                                            applicationJson,
                                                            importedApplication.getId(),
                                                            "main")
                                                    );
                                        }
                                )
                );

        StepVerifier
                .create(resultMonoWithDiscardOperation
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    final List<ActionCollection> actionCollectionList = tuple.getT2();

                    assertThat(application.getWorkspaceId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).contains(deletedActionCollectionNames);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void applySchemaMigration_jsonFileWithFirstVersion_migratedToLatestVersionSuccess() {
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/file-with-v1.json");

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });
        Mono<ApplicationJson> v1ApplicationMono = stringifiedFile
                .map(data -> {
                    Gson gson = new Gson();
                    return gson.fromJson(data, ApplicationJson.class);
                }).cache();

        Mono<ApplicationJson> migratedApplicationMono = v1ApplicationMono
                .map(applicationJson -> {
                    ApplicationJson applicationJson1 = new ApplicationJson();
                    AppsmithBeanUtils.copyNestedNonNullProperties(applicationJson, applicationJson1);
                    return JsonSchemaMigration.migrateApplicationToLatestSchema(applicationJson1);
                });

        StepVerifier
                .create(Mono.zip(v1ApplicationMono, migratedApplicationMono))
                .assertNext(tuple -> {
                    ApplicationJson v1ApplicationJson = tuple.getT1();
                    ApplicationJson latestApplicationJson = tuple.getT2();

                    assertThat(v1ApplicationJson.getServerSchemaVersion()).isEqualTo(1);
                    assertThat(v1ApplicationJson.getClientSchemaVersion()).isEqualTo(1);

                    assertThat(latestApplicationJson.getServerSchemaVersion()).isEqualTo(JsonSchemaVersions.serverVersion);
                    assertThat(latestApplicationJson.getClientSchemaVersion()).isEqualTo(JsonSchemaVersions.clientVersion);
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
        testApplication = applicationPageService.createApplication(testApplication, workspaceId).block();
        assert testApplication != null;
        exportWithConfigurationAppId = testApplication.getId();
        ApplicationAccessDTO accessDTO = new ApplicationAccessDTO();
        accessDTO.setPublicAccess(true);
        applicationService.changeViewAccess(exportWithConfigurationAppId, accessDTO).block();
        final String appName = testApplication.getName();
        final Mono<ApplicationJson> resultMono = Mono.zip(
                        Mono.just(testApplication),
                        newPageService.findPageById(testApplication.getPages().get(0).getId(), READ_PAGES, false)
                )
                .flatMap(tuple -> {
                    Application testApp = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    Layout layout = testPage.getLayouts().get(0);
                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject dsl = new JSONObject();
                    try {
                        dsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                    }

                    ArrayList children = (ArrayList) dsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
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

                    return layoutCollectionService.createCollection(actionCollectionDTO1)
                            .then(layoutActionService.createSingleAction(action))
                            .then(layoutActionService.createSingleAction(action2))
                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout))
                            .then(importExportApplicationService.exportApplicationById(testApp.getId(), ""));
                })
                .cache();

        Mono<List<NewAction>> actionListMono = resultMono
                .then(newActionService
                        .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null).collectList());

        Mono<List<ActionCollection>> collectionListMono = resultMono.then(
                actionCollectionService
                        .findAllByApplicationIdAndViewMode(testApplication.getId(), false, READ_ACTIONS, null).collectList());

        Mono<List<NewPage>> pageListMono = resultMono.then(
                newPageService
                        .findNewPagesByApplicationId(testApplication.getId(), READ_PAGES).collectList());

        StepVerifier
                .create(Mono.zip(resultMono, actionListMono, collectionListMono, pageListMono))
                .assertNext(tuple -> {

                    ApplicationJson applicationJson = tuple.getT1();
                    List<NewAction> DBActions = tuple.getT2();
                    List<ActionCollection> DBCollections = tuple.getT3();
                    List<NewPage> DBPages = tuple.getT4();

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<ActionCollection> actionCollectionList = applicationJson.getActionCollectionList();
                    List<Datasource> datasourceList = applicationJson.getDatasourceList();

                    List<String> exportedCollectionIds = actionCollectionList.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> exportedActionIds = actionList.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBCollectionIds = DBCollections.stream().map(ActionCollection::getId).collect(Collectors.toList());
                    List<String> DBActionIds = DBActions.stream().map(NewAction::getId).collect(Collectors.toList());
                    List<String> DBOnLayoutLoadActionIds = new ArrayList<>();
                    List<String> exportedOnLayoutLoadActionIds = new ArrayList<>();

                    DBPages.forEach(newPage ->
                            newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(actionDTO -> DBOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            })
                    );

                    pageList.forEach(newPage ->
                            newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(dslActionDTOSet -> {
                                        dslActionDTOSet.forEach(actionDTO -> exportedOnLayoutLoadActionIds.add(actionDTO.getId()));
                                    });
                                }
                            })
                    );

                    NewPage defaultPage = pageList.get(0);

                    assertThat(exportedApp.getName()).isEqualTo(appName);
                    assertThat(exportedApp.getWorkspaceId()).isNull();
                    assertThat(exportedApp.getPages()).hasSize(1);
                    ApplicationPage page = exportedApp.getPages().get(0);

                    assertThat(page.getId()).isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(page.getIsDefault()).isTrue();
                    assertThat(page.getDefaultPageId()).isNull();

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isNull();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream().filter(action -> action.getId().equals("Page1_validAction")).findFirst().get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getWorkspaceId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    ActionDTO unpublishedAction = validAction.getUnpublishedAction();
                    assertThat(unpublishedAction.getPageId()).isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(unpublishedAction.getDatasource().getPluginId()).isEqualTo(installedPlugin.getPackageName());

                    NewAction testAction1 = actionList.stream().filter(action -> action.getUnpublishedAction().getName().equals("testAction1")).findFirst().get();
                    assertThat(testAction1.getId()).isEqualTo("Page1_testCollection1.testAction1");

                    assertThat(actionCollectionList.isEmpty()).isFalse();
                    assertThat(actionCollectionList).hasSize(1);
                    final ActionCollection actionCollection = actionCollectionList.get(0);
                    assertThat(actionCollection.getApplicationId()).isNull();
                    assertThat(actionCollection.getWorkspaceId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType()).isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId()).isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    Datasource datasource = datasourceList.get(0);
                    assertThat(datasource.getWorkspaceId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNotNull();

                    final Map<String, InvisibleActionFields> invisibleActionFields = applicationJson.getInvisibleActionFields();

                    assertThat(invisibleActionFields).isNull();
                    for (NewAction newAction : actionList) {
                        if (newAction.getId().equals("Page1_validAction2")) {
                            assertEquals(true, newAction.getUnpublishedAction().getUserSetOnLoad());
                        } else {
                            assertEquals(false, newAction.getUnpublishedAction().getUserSetOnLoad());
                        }
                    }

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNull();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNull();
                    assertThat(applicationJson.getEditModeTheme()).isNotNull();
                    assertThat(applicationJson.getEditModeTheme().isSystemTheme()).isTrue();
                    assertThat(applicationJson.getEditModeTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    assertThat(applicationJson.getPublishedTheme()).isNotNull();
                    assertThat(applicationJson.getPublishedTheme().isSystemTheme()).isTrue();
                    assertThat(applicationJson.getPublishedTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

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
        Mono<ApplicationJson> exportApplicationMono = importExportApplicationService
                .exportApplicationById(exportWithConfigurationAppId, SerialiseApplicationObjective.SHARE);

        StepVerifier
                .create(exportApplicationMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getExportedApplication()).isNotNull();
                    assertThat(applicationJson.getDecryptedFields()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_datasourceWithSameNameAndDifferentPlugin_importedWithValidActionsAndSuffixedDatasource() {

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json").block();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Duplicate datasource with different plugin org");
        testWorkspace = workspaceService.create(testWorkspace).block();

        Datasource testDatasource = new Datasource();
        // Chose any plugin except for mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importExportApplicationService.importApplicationInWorkspace(testWorkspace.getId(), applicationJson);

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByWorkspaceId(application.getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList()
                        )))
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

        ApplicationJson applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json").block();

        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Duplicate datasource with same plugin org");
        testWorkspace = workspaceService.create(testWorkspace).block();

        Datasource testDatasource = new Datasource();
        // Chose plugin same as mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("MongoDB").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importExportApplicationService.importApplicationInWorkspace(testWorkspace.getId(), applicationJson);

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByWorkspaceId(application.getWorkspaceId(), MANAGE_DATASOURCES).collectList(),
                                newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList()
                        )))
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
                    // Check that there are no datasources are created with suffix names as datasource's are of same plugin
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
    public void exportAndImportApplication_withMultiplePagesOrderSameInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportAndImportApplication_withMultiplePagesOrderSameInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService.createApplication(testApplication, workspaceId).block();
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
        applicationPageService.reorderPage(testApplication.getId(), testPage1.getId(), 0, null).block();
        applicationPageService.reorderPage(testApplication.getId(), testPage2.getId(), 1, null).block();
        // Deploy the current application
        applicationPageService.publish(testApplication.getId(), true).block();

        Mono<ApplicationJson> applicationJsonMono = importExportApplicationService.exportApplicationById(testApplication.getId(), "").cache();

        StepVerifier
                .create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getPageOrder()).isNull();
                    assertThat(applicationJson.getPublishedPageOrder()).isNull();
                    List<String> pageList = applicationJson.getExportedApplication().getPages()
                            .stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    assertThat(pageList.get(0)).isEqualTo("testPage1");
                    assertThat(pageList.get(1)).isEqualTo("testPage2");
                    assertThat(pageList.get(2)).isEqualTo("Page1");

                    List<String> publishedPageList = applicationJson.getExportedApplication().getPublishedPages()
                            .stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    assertThat(publishedPageList.get(0)).isEqualTo("testPage1");
                    assertThat(publishedPageList.get(1)).isEqualTo("testPage2");
                    assertThat(publishedPageList.get(2)).isEqualTo("Page1");
                })
                .verifyComplete();

        ApplicationJson applicationJson = applicationJsonMono.block();
        Application application = importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson).block();

        // Get the unpublished pages and verify the order
        List<ApplicationPage> pageDTOS = application.getPages();
        Mono<NewPage> newPageMono1 = newPageService.findById(pageDTOS.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono2 = newPageService.findById(pageDTOS.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono3 = newPageService.findById(pageDTOS.get(2).getId(), MANAGE_PAGES);

        StepVerifier
                .create(Mono.zip(newPageMono1, newPageMono2, newPageMono3))
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
        Mono<NewPage> newPublishedPageMono1 = newPageService.findById(publishedPageDTOs.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono2 = newPageService.findById(publishedPageDTOs.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono3 = newPageService.findById(publishedPageDTOs.get(2).getId(), MANAGE_PAGES);

        StepVerifier
                .create(Mono.zip(newPublishedPageMono1, newPublishedPageMono2, newPublishedPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getPublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("testPage2");
                    assertThat(newPage3.getPublishedPage().getName()).isEqualTo("Page1");

                    assertThat(newPage1.getId()).isEqualTo(publishedPageDTOs.get(0).getId());
                    assertThat(newPage2.getId()).isEqualTo(publishedPageDTOs.get(1).getId());
                    assertThat(newPage3.getId()).isEqualTo(publishedPageDTOs.get(2).getId());
                })
                .verifyComplete();

    }


    @Test
    @WithUserDetails(value = "api_user")
    public void exportAndImportApplication_withMultiplePagesOrderDifferentInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportAndImportApplication_withMultiplePagesOrderDifferentInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService.createApplication(testApplication, workspaceId).block();
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
        applicationPageService.reorderPage(testApplication.getId(), testPage1.getId(), 0, null).block();
        applicationPageService.reorderPage(testApplication.getId(), testPage2.getId(), 1, null).block();

        Mono<ApplicationJson> applicationJsonMono = importExportApplicationService.exportApplicationById(testApplication.getId(), "").cache();

        StepVerifier
                .create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    exportedApplication.setViewMode(false);
                    List<String> pageOrder = exportedApplication.getPages()
                            .stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    assertThat(pageOrder.get(0)).isEqualTo("testPage1");
                    assertThat(pageOrder.get(1)).isEqualTo("testPage2");
                    assertThat(pageOrder.get(2)).isEqualTo("Page1");

                    pageOrder.clear();
                    pageOrder = exportedApplication.getPublishedPages()
                            .stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    assertThat(pageOrder.get(0)).isEqualTo("Page1");
                    assertThat(pageOrder.get(1)).isEqualTo("testPage1");
                    assertThat(pageOrder.get(2)).isEqualTo("testPage2");
                })
                .verifyComplete();

        ApplicationJson applicationJson = applicationJsonMono.block();
        Application application = importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson).block();

        // Get the unpublished pages and verify the order
        application.setViewMode(false);
        List<ApplicationPage> pageDTOS = application.getPages();
        Mono<NewPage> newPageMono1 = newPageService.findById(pageDTOS.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono2 = newPageService.findById(pageDTOS.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPageMono3 = newPageService.findById(pageDTOS.get(2).getId(), MANAGE_PAGES);

        StepVerifier
                .create(Mono.zip(newPageMono1, newPageMono2, newPageMono3))
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
        Mono<NewPage> newPublishedPageMono1 = newPageService.findById(publishedPageDTOs.get(0).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono2 = newPageService.findById(publishedPageDTOs.get(1).getId(), MANAGE_PAGES);
        Mono<NewPage> newPublishedPageMono3 = newPageService.findById(publishedPageDTOs.get(2).getId(), MANAGE_PAGES);

        StepVerifier
                .create(Mono.zip(newPublishedPageMono1, newPublishedPageMono2, newPublishedPageMono3))
                .assertNext(objects -> {
                    NewPage newPage1 = objects.getT1();
                    NewPage newPage2 = objects.getT2();
                    NewPage newPage3 = objects.getT3();
                    assertThat(newPage1.getPublishedPage().getName()).isEqualTo("Page1");
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("testPage1");
                    assertThat(newPage3.getPublishedPage().getName()).isEqualTo("testPage2");

                    assertThat(newPage1.getId()).isEqualTo(publishedPageDTOs.get(0).getId());
                    assertThat(newPage2.getId()).isEqualTo(publishedPageDTOs.get(1).getId());
                    assertThat(newPage3.getId()).isEqualTo(publishedPageDTOs.get(2).getId());
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

        Datasource sampleDatasource = new Datasource();
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
        Mono<Application> createAppAndPageMono = applicationPageService.createApplication(destApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono
        ApplicationJson applicationJson = createApplicationJSON(List.of("Home", "About"));

        Mono<Tuple3<ApplicationPagesDTO, List<NewAction>, List<ActionCollection>>> tuple2Mono = createAppAndPageMono.flatMap(application ->
                // merge the application json with the application we've created
                importExportApplicationService.mergeApplicationJsonWithApplication(application.getWorkspaceId(), application.getId(), null, applicationJson, null)
                        .thenReturn(application)
        ).flatMap(application ->
                // fetch the application pages, this should contain pages from application json
                Mono.zip(
                        newPageService.findApplicationPages(application.getId(), null, null, ApplicationMode.EDIT),
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                )
        );

        StepVerifier.create(tuple2Mono).assertNext(objects -> {
            ApplicationPagesDTO applicationPagesDTO = objects.getT1();
            List<NewAction> newActionList = objects.getT2();
            List<ActionCollection> actionCollectionList = objects.getT3();

            assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo(destApplication.getName());
            assertThat(applicationPagesDTO.getApplication().getSlug()).isEqualTo(destApplication.getSlug());
            assertThat(applicationPagesDTO.getApplication().getIsPublic()).isFalse();
            assertThat(applicationPagesDTO.getApplication().getForkingEnabled()).isFalse();
            assertThat(applicationPagesDTO.getPages().size()).isEqualTo(4);
            List<String> pageNames = applicationPagesDTO.getPages().stream()
                    .map(PageNameIdDTO::getName)
                    .collect(Collectors.toList());
            assertThat(pageNames).contains("Home", "Home2", "About");
            assertThat(newActionList.size()).isEqualTo(2); // we imported two pages and each page has one action
            assertThat(actionCollectionList.size()).isEqualTo(2); // we imported two pages and each page has one Collection
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void mergeApplicationJsonWithApplication_WhenPageListIProvided_OnlyListedPagesAreMerged() {
        String uniqueString = UUID.randomUUID().toString();

        Application destApplication = new Application();
        destApplication.setName("App_" + uniqueString);
        Mono<Application> createAppAndPageMono = applicationPageService.createApplication(destApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("Home");
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO).thenReturn(application);
                });

        // let's create an ApplicationJSON which we'll merge with application created by createAppAndPageMono
        ApplicationJson applicationJson = createApplicationJSON(List.of("Profile", "About", "Contact US"));

        Mono<ApplicationPagesDTO> applicationPagesDTOMono = createAppAndPageMono.flatMap(application ->
                // merge the application json with the application we've created
                importExportApplicationService.mergeApplicationJsonWithApplication(application.getWorkspaceId(), application.getId(), null, applicationJson, List.of("About", "Contact US"))
                        .thenReturn(application)
        ).flatMap(application ->
                // fetch the application pages, this should contain pages from application json
                newPageService.findApplicationPages(application.getId(), null, null, ApplicationMode.EDIT)
        );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
            assertThat(applicationPagesDTO.getPages().size()).isEqualTo(4);
            List<String> pageNames = applicationPagesDTO.getPages().stream()
                    .map(PageNameIdDTO::getName)
                    .collect(Collectors.toList());
            assertThat(pageNames).contains("Home", "About", "Contact US");
            assertThat(pageNames).doesNotContain("Profile");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenThemeDoesNotExist_ExportedWithDefaultTheme() {
        Theme customTheme = new Theme();
        customTheme.setName("my-custom-theme");

        String randomId = UUID.randomUUID().toString();
        Application testApplication = new Application();
        testApplication.setName("Application_" + randomId);
        Mono<ApplicationJson> exportedAppJson = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    application.setEditModeThemeId("invalid-theme-id");
                    application.setPublishedModeThemeId("invalid-theme-id");
                    String branchName = null;
                    return applicationService.save(application)
                            .then(importExportApplicationService.exportApplicationById(application.getId(), branchName));
                });

        StepVerifier.create(exportedAppJson).assertNext(applicationJson -> {
            assertThat(applicationJson.getEditModeTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
            assertThat(applicationJson.getPublishedTheme().getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_invalidPluginReferenceForDatasource_throwException() {

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        ApplicationJson appJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json").block();
        assert appJson != null;
        final String randomId = UUID.randomUUID().toString();
        appJson.getDatasourceList().get(0).setPluginId(randomId);
        final Mono<Application> resultMono = workspaceService
                .create(newWorkspace)
                .flatMap(workspace -> importExportApplicationService.importApplicationInWorkspace(workspace.getId(), appJson));

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.UNKNOWN_PLUGIN_REFERENCE.getMessage(randomId)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_importSameApplicationTwice_applicationImportedLaterWithSuffixCount() {

        Mono<ApplicationJson> applicationJsonMono = createAppJson("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");

        Mono<Workspace> createWorkspaceMono = workspaceService.create(newWorkspace).cache();
        final Mono<Application> importApplicationMono = createWorkspaceMono
                .zipWith(applicationJsonMono)
                .flatMap(tuple -> {
                    Workspace workspace = tuple.getT1();
                    ApplicationJson applicationJson = tuple.getT2();
                    return importExportApplicationService
                            .importApplicationInWorkspace(workspace.getId(), applicationJson);
                });

        StepVerifier
                .create(importApplicationMono.zipWhen(application -> importApplicationMono))
                .assertNext(tuple -> {
                    Application firstImportedApplication = tuple.getT1();
                    Application secondImportedApplication = tuple.getT2();
                    assertThat(firstImportedApplication.getName()).isEqualTo("valid_application");
                    assertThat(secondImportedApplication.getName()).isEqualTo("valid_application (1)");
                    assertThat(firstImportedApplication.getWorkspaceId()).isEqualTo(secondImportedApplication.getWorkspaceId());
                    assertThat(firstImportedApplication.getWorkspaceId()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_existingApplication_pageAddedSuccessfully() {

        //Create application
        Application application = new Application();
        application.setName("mergeApplication_existingApplication_pageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        finalApplication.getId(),
                        null,
                        applicationJson1,
                        new ArrayList<>())
                )
                .flatMap(application1 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                });


        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                            assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                            assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplication_pageAddedSuccessfully() {

        //Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplication_pageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        finalApplication.getId(),
                        "master",
                        applicationJson1,
                        new ArrayList<>())
                )
                .flatMap(application1 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                });

        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully() {

        //Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationChildBranch_pageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData1 = new GitApplicationMetadata();
        gitData1.setBranchName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                }).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        branchApp.getId(),
                        "feature",
                        applicationJson1,
                        new ArrayList<>())
                )
                .flatMap(application2 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                });

        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully() {
        //Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData1 = new GitApplicationMetadata();
        gitData1.setBranchName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                }).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        branchApp.getId(),
                        "feature",
                        applicationJson1,
                        List.of("Page1"))
                )
                .flatMap(application2 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                });

        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully() {
        //Create application connected to git
        Application testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();

        // Create branch for the application
        testApplication = new Application();
        testApplication.setName("mergeApplication_gitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully1");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData1 = new GitApplicationMetadata();
        gitData1.setBranchName("feature");
        gitData1.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData1);

        Application branchApp = applicationPageService.createApplication(testApplication, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application2);
                }).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        branchApp.getId(),
                        "feature",
                        applicationJson1,
                        List.of("Page1", "Page2"))
                )
                .flatMap(application2 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(branchApp.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(branchApp.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application2), pageList, actionList, actionCollectionList);
                });

        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application3 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application3.getId()).isNotEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application3.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application3.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_nonGitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully() {
        //Create application
        Application application = new Application();
        application.setName("mergeApplication_nonGitConnectedApplicationSelectedSpecificPages_selectedPageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        finalApplication.getId(),
                        null,
                        applicationJson1,
                        List.of("Page1"))
                )
                .flatMap(application1 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                });


        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void mergeApplication_nonGitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully() {
        //Create application
        Application application = new Application();
        application.setName("mergeApplication_nonGitConnectedApplicationSelectedAllPages_selectedPageAddedSuccessfully");
        application.setWorkspaceId(workspaceId);
        application = applicationPageService.createApplication(application).block();

        Mono<ApplicationJson> applicationJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json");

        Application finalApplication = application;
        Mono<Tuple4<Application, List<NewPage>, List<NewAction>, List<ActionCollection>>> importedApplication = applicationJson
                .flatMap(applicationJson1 -> importExportApplicationService.mergeApplicationJsonWithApplication(
                        workspaceId,
                        finalApplication.getId(),
                        null,
                        applicationJson1,
                        List.of("Page1", "Page2"))
                )
                .flatMap(application1 -> {
                    Mono<List<NewPage>> pageList = newPageService.findNewPagesByApplicationId(application1.getId(), MANAGE_PAGES).collectList();
                    Mono<List<NewAction>> actionList = newActionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService.findAllByApplicationIdAndViewMode(application1.getId(), false, MANAGE_ACTIONS, null).collectList();
                    return Mono.zip(Mono.just(application1), pageList, actionList, actionCollectionList);
                });


        StepVerifier
                .create(importedApplication)
                .assertNext(tuple -> {
                    Application application1 = tuple.getT1();
                    List<NewPage> pageList = tuple.getT2();
                    List<NewAction> actionList = tuple.getT3();
                    List<ActionCollection> actionCollectionList = tuple.getT4();

                    assertThat(application1.getId()).isEqualTo(finalApplication.getId());
                    assertThat(finalApplication.getPages().size()).isLessThan(application1.getPages().size());
                    assertThat(finalApplication.getPages().size()).isEqualTo(application1.getPublishedPages().size());

                    // Verify the pages after merging the template
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getUnpublishedPage().getName()).containsAnyOf("Page1", "Page12", "Page2");
                        assertThat(newPage.getGitSyncId()).isNotNull();
                    });

                    NewPage page = pageList.stream().filter(newPage -> newPage.getUnpublishedPage().getName().equals("Page12")).collect(Collectors.toList()).get(0);
                    // Verify the actions after merging the template
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedAction().getName()).containsAnyOf("api_wo_auth", "get_users", "run");
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(page.getId());
                    });

                    // Verify the actionCollections after merging the template
                    actionCollectionList.forEach(newAction -> {
                        assertThat(newAction.getUnpublishedCollection().getName()).containsAnyOf("JSObject1", "JSObject2");
                        assertThat(newAction.getUnpublishedCollection().getPageId()).isEqualTo(page.getId());
                    });
                })
                .verifyComplete();
    }
}
