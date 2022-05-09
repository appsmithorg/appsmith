package com.appsmith.server.solutions;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
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
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
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
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Type;
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
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class ImportExportApplicationServiceTests {

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

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
    OrganizationService organizationService;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    ThemeService themeService;

    @Autowired
    ApplicationService applicationService;

    private static final String INVALID_JSON_FILE = "invalid json file";
    private static Plugin installedPlugin;
    private static String orgId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;
    private static String exportWithConfigurationAppId;

    @Before
    public void setup() {
        Mockito
                .when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (Boolean.TRUE.equals(isSetupDone)) {
            return;
        }
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        Organization organization = new Organization();
        organization.setName("Import-Export-Test-Organization");
        Organization savedOrganization = organizationService.create(organization).block();
        orgId = savedOrganization.getId();

        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setOrganizationId(orgId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());

        Application savedApplication = applicationPageService.createApplication(testApplication, orgId).block();
        testAppId = savedApplication.getId();

        Datasource ds1 = new Datasource();
        ds1.setName("DS1");
        ds1.setOrganizationId(orgId);
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
        ds2.setOrganizationId(orgId);
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        ds2.getDatasourceConfiguration().setAuthentication(auth);

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS datasource");
        jsDatasource.setOrganizationId(orgId);
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
                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();
                    return gson.fromJson(data, fileType);
                });
    }

    private Organization createTemplateOrganization() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");
        return organizationService.create(newOrganization).block();
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

        final Mono<ApplicationJson> resultMono = organizationService.getById(orgId)
                .flatMap(organization -> {

                    final Datasource ds1 = datasourceMap.get("DS1");
                    ds1.setOrganizationId(organization.getId());

                    final Datasource ds2 = datasourceMap.get("DS2");
                    ds2.setOrganizationId(organization.getId());

                    return  applicationPageService.createApplication(testApplication, orgId);
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

        Organization newOrganization = new Organization();
        newOrganization.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("ApplicationWithActionCollectionAndDatasource");
        testApplication = applicationPageService.createApplication(testApplication, orgId).block();

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
                    actionCollectionDTO1.setOrganizationId(testApp.getOrganizationId());
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
                            .then(layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout))
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
                    assertThat(exportedApp.getOrganizationId()).isNull();
                    assertThat(exportedApp.getPages()).isNull();

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isEmpty();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream().filter(action -> action.getId().equals("Page1_validAction")).findFirst().get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getOrganizationId()).isNull();
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
                    assertThat(actionCollection.getOrganizationId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType()).isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId()).isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    Datasource datasource = datasourceList.get(0);
                    assertThat(datasource.getOrganizationId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNull();

                    final Map<String, InvisibleActionFields> invisibleActionFields = applicationJson.getInvisibleActionFields();

                    Assert.assertEquals(3, invisibleActionFields.size());
                    NewAction validAction2 = actionList.stream().filter(action -> action.getId().equals("Page1_validAction2")).findFirst().get();
                    Assert.assertEquals(true, invisibleActionFields.get(validAction2.getId()).getUnpublishedUserSetOnLoad());

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNotEmpty();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNotEmpty();
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

        final Mono<ApplicationJson> resultMono = Mono.zip(
                organizationService.getById(orgId),
                applicationRepository.findById(testAppId)
            )
            .flatMap(tuple -> {

                Organization organization = tuple.getT1();
                Application testApp = tuple.getT2();

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
                assertThat(exportedApp.getOrganizationId()).isNull();
                assertThat(exportedApp.getPages()).isNull();
                assertThat(exportedApp.getGitApplicationMetadata()).isNull();

                assertThat(exportedApp.getPolicies()).isNull();

                assertThat(pageList).hasSize(1);
                assertThat(newPage.getApplicationId()).isNull();
                assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                assertThat(newPage.getId()).isNull();
                assertThat(newPage.getPolicies()).isEmpty();

                assertThat(actionList.isEmpty()).isFalse();
                NewAction validAction = actionList.get(0);
                assertThat(validAction.getApplicationId()).isNull();
                assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                assertThat(validAction.getOrganizationId()).isNull();
                assertThat(validAction.getPolicies()).isNull();
                assertThat(validAction.getId()).isNotNull();
                assertThat(validAction.getUnpublishedAction().getPageId())
                    .isEqualTo(newPage.getUnpublishedPage().getName());

                assertThat(datasourceList).hasSize(1);
                Datasource datasource = datasourceList.get(0);
                assertThat(datasource.getOrganizationId()).isNull();
                assertThat(datasource.getId()).isNull();
                assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                assertThat(datasource.getDatasourceConfiguration()).isNull();

                assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNotEmpty();
                assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNotEmpty();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromInvalidFileTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(new ClassPathResource("test_assets/OrganizationServiceTest/my_organization_logo.png"), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId, filepart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }
    
    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationWithNullOrganizationIdTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService
            .extractFileAndSaveApplication(null, filepart);
        
        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ORGANIZATION_ID)))
            .verify();
    }
    
    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromInvalidJsonFileWithoutPagesTest() {
        
        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-json-without-pages.json");
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);
        
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
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);
        
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
    
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");
    
        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
            .users(Set.of("api_user"))
            .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
            .users(Set.of("api_user"))
            .build();
    
        final Mono<ApplicationImportDTO> resultMono = organizationService
            .create(newOrganization)
            .flatMap(organization -> importExportApplicationService
                .extractFileAndSaveApplication(organization.getId(), filePart)
            );
        
        StepVerifier
            .create(resultMono
                .flatMap(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    return Mono.zip(
                            Mono.just(applicationImportDTO),
                            datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
                            newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                            newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                            actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                    );
                }))
            .assertNext(tuple -> {
                final Application application = tuple.getT1().getApplication();
                final List<Datasource> unConfiguredDatasourceList  = tuple.getT1().getUnConfiguredDatasourceList();
                final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                final List<Datasource> datasourceList = tuple.getT2();
                final List<NewAction> actionList = tuple.getT3();
                final List<PageDTO> pageList = tuple.getT4();
                final List<ActionCollection> actionCollectionList = tuple.getT5();

                assertThat(application.getName()).isEqualTo("valid_application");
                assertThat(application.getOrganizationId()).isNotNull();
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
                    assertThat(datasource.getOrganizationId()).isEqualTo(application.getOrganizationId());
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

        Organization newOrganization = new Organization();
        newOrganization.setName("Midway cancel import app organization");
        newOrganization = organizationService.create(newOrganization).block();

        importExportApplicationService
                .extractFileAndSaveApplication(newOrganization.getId(), filePart)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for import to complete
        Mono<Application> importedAppFromDbMono = Mono.just(newOrganization)
                .flatMap(organization -> {
                    try {
                        // Before fetching the imported application, sleep for 5 seconds to ensure that the import completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository.findByOrganizationId(organization.getId(), READ_APPLICATIONS)
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
    public void importApplicationInOrganization_WhenCustomizedThemes_ThemesCreated() {
        FilePart filePart = createFilePart(
                "test_assets/ImportExportServiceTest/valid-application-with-custom-themes.json"
        );

        Organization newOrganization = new Organization();
        newOrganization.setName("Import theme test org");

        final Mono<ApplicationImportDTO> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
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
                    assertThat(editTheme.getOrganizationId()).isNull();
                    assertThat(editTheme.getApplicationId()).isNull();

                    assertThat(publishedTheme.isSystemTheme()).isFalse();
                    assertThat(publishedTheme.getDisplayName()).isEqualTo("Custom published theme");
                    assertThat(publishedTheme.getOrganizationId()).isNullOrEmpty();
                    assertThat(publishedTheme.getApplicationId()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withoutActionCollection_succeedsWithoutError() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/valid-application-without-action-collection.json");

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        final Mono<ApplicationImportDTO> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> Mono.zip(
                                Mono.just(applicationImportDTO),
                                datasourceService.findAllByOrganizationId(applicationImportDTO.getApplication().getOrganizationId(), MANAGE_DATASOURCES).collectList(),
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
                    assertThat(application.getOrganizationId()).isNotNull();
                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getPublishedPages()).hasSize(1);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();

                    assertThat(datasourceList).isNotEmpty();
                    datasourceList.forEach(datasource -> {
                        assertThat(datasource.getOrganizationId()).isEqualTo(application.getOrganizationId());
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

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        final Mono<ApplicationImportDTO> resultMono = organizationService.create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
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

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        final Mono<ApplicationImportDTO> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> Mono.zip(
                                Mono.just(applicationImportDTO),
                                datasourceService.findAllByOrganizationId(applicationImportDTO.getApplication().getOrganizationId(), MANAGE_DATASOURCES).collectList(),
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
        testApplication.setOrganizationId(orgId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("testBranch");
        testApplication.setGitApplicationMetadata(gitData);

        Application savedApplication = applicationPageService.createApplication(testApplication, orgId)
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
                        .flatMap(applicationJson -> importExportApplicationService.importApplicationInOrganization(orgId, applicationJson, savedApplication.getId(), gitData.getBranchName())))
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
        Mono<ApplicationImportDTO> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);

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

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        final Mono<ApplicationImportDTO> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(applicationImportDTO -> {
                            Application application = applicationImportDTO.getApplication();
                            return Mono.zip(
                                    Mono.just(applicationImportDTO),
                                    datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
                                    newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                    newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                                    actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                            );
                        }))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1().getApplication();
                    final List<Datasource> unConfiguredDatasourceList  = tuple.getT1().getUnConfiguredDatasourceList();
                    final boolean isPartialImport = tuple.getT1().getIsPartialImport();
                    final List<Datasource> datasourceList = tuple.getT2();
                    final List<NewAction> actionList = tuple.getT3();
                    final List<PageDTO> pageList = tuple.getT4();
                    final List<ActionCollection> actionCollectionList = tuple.getT5();

                    assertThat(application.getName()).isEqualTo("importExportTest");
                    assertThat(application.getOrganizationId()).isNotNull();
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

    public void importApplicationIntoOrganization_pageRemovedAndUpdatedDefaultPageNameInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoOrganization_pageRemovedInBranchApplication_Success");
        testApplication.setOrganizationId(orgId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, orgId)
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

        Application importedApplication = importExportApplicationService.importApplicationInOrganization(orgId, applicationJson, application.getId(), "master").block();

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
    public void importApplicationIntoOrganization_pageAddedInBranchApplication_Success() {
        Application testApplication = new Application();
        testApplication.setName("importApplicationIntoOrganization_pageAddedInBranchApplication_Success");
        testApplication.setOrganizationId(orgId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, orgId)
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

        Application applicationMono = importExportApplicationService.importApplicationInOrganization(orgId, applicationJson, application.getId(), "master").block();

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
    public void importUpdatedApplicationIntoOrganizationFromFile_publicApplication_visibilityFlagNotReset() {
        // Create a application and make it public
        // Now add a page and export the same import it to the app
        // Check if the policies and visibility flag are not reset

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Application testApplication = new Application();
        testApplication.setName("importUpdatedApplicationIntoOrganizationFromFile_publicApplication_visibilityFlagNotReset");
        testApplication.setOrganizationId(orgId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        Application application = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                }).block();
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        applicationService.changeViewAccess(application.getId(), "master", applicationAccessDTO).block();

        Mono<Application> applicationMono = importExportApplicationService.exportApplicationById(application.getId(), "master")
                .flatMap(applicationJson -> importExportApplicationService.importApplicationInOrganization(orgId, applicationJson, application.getId(), "master"));

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
        String orgId = createTemplateOrganization().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-added");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
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
                    assertThat(application.getOrganizationId()).isNotNull();
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
                                                    .then(importExportApplicationService.importApplicationInOrganization(
                                                            importedApplication.getOrganizationId(),
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
        String orgId = createTemplateOrganization().getId();

        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-added");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
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
                    assertThat(application.getOrganizationId()).isNotNull();


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
                                            .then(importExportApplicationService.importApplicationInOrganization(
                                                    importedApplication.getOrganizationId(),
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

                    assertThat(application.getOrganizationId()).isNotNull();

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
        String orgId = createTemplateOrganization().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-added");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
                })
                .flatMap(application -> {
                    ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
                    actionCollectionDTO1.setName("discard-action-collection-test");
                    actionCollectionDTO1.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO1.setApplicationId(application.getId());
                    actionCollectionDTO1.setOrganizationId(application.getOrganizationId());
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
                    assertThat(application.getOrganizationId()).isNotNull();

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
                                                    .then(importExportApplicationService.importApplicationInOrganization(
                                                            importedApplication.getOrganizationId(),
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

                    assertThat(application.getOrganizationId()).isNotNull();

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
        String orgId = createTemplateOrganization().getId();
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-page-removed");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
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
                    assertThat(application.getOrganizationId()).isNotNull();
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
                                                    .then(importExportApplicationService.importApplicationInOrganization(
                                                            importedApplication.getOrganizationId(),
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
        String orgId = createTemplateOrganization().getId();
        final String[] deletedActionName = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-action-removed");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
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
                    assertThat(application.getOrganizationId()).isNotNull();

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
                                                    .then(importExportApplicationService.importApplicationInOrganization(
                                                            importedApplication.getOrganizationId(),
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

                    assertThat(application.getOrganizationId()).isNotNull();

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
        String orgId = createTemplateOrganization().getId();
        final String[] deletedActionCollectionNames = new String[1];
        final Mono<Application> resultMonoWithoutDiscardOperation = applicationJsonMono
                .flatMap(applicationJson -> {
                    applicationJson.getExportedApplication().setName("discard-change-collection-removed");
                    return importExportApplicationService.importApplicationInOrganization(orgId, applicationJson);
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
                    assertThat(application.getOrganizationId()).isNotNull();

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
                                                    .then(importExportApplicationService.importApplicationInOrganization(
                                                            importedApplication.getOrganizationId(),
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

                    assertThat(application.getOrganizationId()).isNotNull();

                    List<String> actionCollectionNames = new ArrayList<>();
                    actionCollectionList.forEach(actionCollection -> actionCollectionNames.add(actionCollection.getUnpublishedCollection().getName()));
                    assertThat(actionCollectionNames).contains(deletedActionCollectionNames);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void applySchemaMigration_jsonFileWithFirstVersion_migratedToLatestVersionSuccess() {
        Mono<ApplicationJson> v1ApplicationMono = createAppJson("test_assets/ImportExportServiceTest/file-with-v1.json").cache();
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
        Organization newOrganization = new Organization();
        newOrganization.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportApplication_withCredentialsForSampleApps_SuccessWithDecryptFields");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService.createApplication(testApplication, orgId).block();
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
                    actionCollectionDTO1.setOrganizationId(testApp.getOrganizationId());
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
                            .then(layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout))
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
                    assertThat(exportedApp.getOrganizationId()).isNull();
                    assertThat(exportedApp.getPages()).isNull();

                    assertThat(exportedApp.getPolicies()).isNull();

                    assertThat(pageList).hasSize(1);
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                    assertThat(defaultPage.getId()).isNull();
                    assertThat(defaultPage.getPolicies()).isEmpty();

                    assertThat(actionList.isEmpty()).isFalse();
                    assertThat(actionList).hasSize(3);
                    NewAction validAction = actionList.stream().filter(action -> action.getId().equals("Page1_validAction")).findFirst().get();
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getOrganizationId()).isNull();
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
                    assertThat(actionCollection.getOrganizationId()).isNull();
                    assertThat(actionCollection.getPolicies()).isNull();
                    assertThat(actionCollection.getId()).isNotNull();
                    assertThat(actionCollection.getUnpublishedCollection().getPluginType()).isEqualTo(PluginType.JS);
                    assertThat(actionCollection.getUnpublishedCollection().getPageId())
                            .isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(actionCollection.getUnpublishedCollection().getPluginId()).isEqualTo(installedJsPlugin.getPackageName());

                    assertThat(datasourceList).hasSize(1);
                    Datasource datasource = datasourceList.get(0);
                    assertThat(datasource.getOrganizationId()).isNull();
                    assertThat(datasource.getId()).isNull();
                    assertThat(datasource.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(datasource.getDatasourceConfiguration()).isNotNull();

                    final Map<String, InvisibleActionFields> invisibleActionFields = applicationJson.getInvisibleActionFields();

                    Assert.assertEquals(3, invisibleActionFields.size());
                    NewAction validAction2 = actionList.stream().filter(action -> action.getId().equals("Page1_validAction2")).findFirst().get();
                    Assert.assertEquals(true, invisibleActionFields.get(validAction2.getId()).getUnpublishedUserSetOnLoad());

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNotEmpty();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNotEmpty();
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

        Organization testOrganization = new Organization();
        testOrganization.setName("Duplicate datasource with different plugin org");
        testOrganization = organizationService.create(testOrganization).block();

        Datasource testDatasource = new Datasource();
        // Chose any plugin except for mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setOrganizationId(testOrganization.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importExportApplicationService.importApplicationInOrganization(testOrganization.getId(), applicationJson);

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
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
                        assertThat(datasource.getOrganizationId()).isEqualTo(application.getOrganizationId());
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

        Organization testOrganization = new Organization();
        testOrganization.setName("Duplicate datasource with same plugin org");
        testOrganization = organizationService.create(testOrganization).block();

        Datasource testDatasource = new Datasource();
        // Chose plugin same as mongo, as json static file has mongo plugin for datasource
        Plugin postgreSQLPlugin = pluginRepository.findByName("MongoDB").block();
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setOrganizationId(testOrganization.getId());
        final String datasourceName = applicationJson.getDatasourceList().get(0).getName();
        testDatasource.setName(datasourceName);
        datasourceService.create(testDatasource).block();

        final Mono<Application> resultMono = importExportApplicationService.importApplicationInOrganization(testOrganization.getId(), applicationJson);

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
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
                        assertThat(datasource.getOrganizationId()).isEqualTo(application.getOrganizationId());
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
        Organization newOrganization = new Organization();
        newOrganization.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportAndImportApplication_withMultiplePagesOrderSameInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService.createApplication(testApplication, orgId).block();
        assert testApplication != null;

        PageDTO testPage = new PageDTO();
        testPage.setName("123");
        testPage.setApplicationId(testApplication.getId());
        PageDTO page1 = applicationPageService.createPage(testPage).block();

        testPage = new PageDTO();
        testPage.setName("abc");
        testPage.setApplicationId(testApplication.getId());
        PageDTO page2 = applicationPageService.createPage(testPage).block();

        // Set order for the newly created pages
        applicationPageService.reorderPage(testApplication.getId(), page1.getId(), 0, null).block();
        applicationPageService.reorderPage(testApplication.getId(), page2.getId(), 1, null).block();
        // Deploy the current application
        applicationPageService.publish(testApplication.getId(), true).block();

        Mono<ApplicationJson> applicationJsonMono = importExportApplicationService.exportApplicationById(testApplication.getId(), "");

        StepVerifier
                .create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    List<String> pageList = applicationJson.getPageOrder();
                    assertThat(pageList.get(0)).isEqualTo("123");
                    assertThat(pageList.get(1)).isEqualTo("abc");
                    assertThat(pageList.get(2)).isEqualTo("Page1");

                    List<String> publishedPageList = applicationJson.getPublishedPageOrder();
                    assertThat(publishedPageList.get(0)).isEqualTo("123");
                    assertThat(publishedPageList.get(1)).isEqualTo("abc");
                    assertThat(publishedPageList.get(2)).isEqualTo("Page1");
                })
                .verifyComplete();

        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(testApplication.getId(), "").block();
        Application application = importExportApplicationService.importApplicationInOrganization(orgId, applicationJson).block();

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
                    assertThat(newPage1.getUnpublishedPage().getName()).isEqualTo("123");
                    assertThat(newPage2.getUnpublishedPage().getName()).isEqualTo("abc");
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
                    assertThat(newPage1.getPublishedPage().getName()).isEqualTo("123");
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("abc");
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
        Organization newOrganization = new Organization();
        newOrganization.setName("template-org-with-ds");

        Application testApplication = new Application();
        testApplication.setName("exportAndImportApplication_withMultiplePagesOrderDifferentInDeployAndEditMode_PagesOrderIsMaintainedInEditAndViewMode");
        testApplication.setExportWithConfiguration(true);
        testApplication = applicationPageService.createApplication(testApplication, orgId).block();
        assert testApplication != null;

        PageDTO testPage = new PageDTO();
        testPage.setName("123");
        testPage.setApplicationId(testApplication.getId());
        PageDTO page1 = applicationPageService.createPage(testPage).block();

        testPage = new PageDTO();
        testPage.setName("abc");
        testPage.setApplicationId(testApplication.getId());
        PageDTO page2 = applicationPageService.createPage(testPage).block();

        // Deploy the current application so that edit and view mode will have different page order
        applicationPageService.publish(testApplication.getId(), true).block();

        // Set order for the newly created pages
        applicationPageService.reorderPage(testApplication.getId(), page1.getId(), 0, null).block();
        applicationPageService.reorderPage(testApplication.getId(), page2.getId(), 1, null).block();

        Mono<ApplicationJson> applicationJsonMono = importExportApplicationService.exportApplicationById(testApplication.getId(), "");

        StepVerifier
                .create(applicationJsonMono)
                .assertNext(applicationJson -> {
                    List<String> pageList = applicationJson.getPageOrder();
                    assertThat(pageList.get(0)).isEqualTo("123");
                    assertThat(pageList.get(1)).isEqualTo("abc");
                    assertThat(pageList.get(2)).isEqualTo("Page1");

                    List<String> publishedPageOrder = applicationJson.getPageOrder();
                    assertThat(publishedPageOrder.get(0)).isEqualTo("123");
                    assertThat(publishedPageOrder.get(1)).isEqualTo("abc");
                    assertThat(publishedPageOrder.get(2)).isEqualTo("Page1");
                })
                .verifyComplete();

        ApplicationJson applicationJson = importExportApplicationService.exportApplicationById(testApplication.getId(), "").block();
        Application application = importExportApplicationService.importApplicationInOrganization(orgId, applicationJson).block();

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
                    assertThat(newPage1.getUnpublishedPage().getName()).isEqualTo("123");
                    assertThat(newPage2.getUnpublishedPage().getName()).isEqualTo("abc");
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
                    assertThat(newPage2.getPublishedPage().getName()).isEqualTo("123");
                    assertThat(newPage3.getPublishedPage().getName()).isEqualTo("abc");

                    assertThat(newPage1.getId()).isEqualTo(publishedPageDTOs.get(0).getId());
                    assertThat(newPage2.getId()).isEqualTo(publishedPageDTOs.get(1).getId());
                    assertThat(newPage3.getId()).isEqualTo(publishedPageDTOs.get(2).getId());
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
        Mono<ApplicationJson> exportedAppJson = applicationPageService.createApplication(testApplication, orgId)
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

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        ApplicationJson appJson = createAppJson("test_assets/ImportExportServiceTest/valid-application.json").block();
        assert appJson != null;
        final String randomId = UUID.randomUUID().toString();
        appJson.getDatasourceList().get(0).setPluginId(randomId);
        final Mono<Application> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService.importApplicationInOrganization(organization.getId(), appJson));

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.UNKNOWN_PLUGIN_REFERENCE.getMessage(randomId)))
                .verify();
    }
}
