package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
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
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
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
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
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
import java.util.Set;
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

    private static final String INVALID_JSON_FILE = "invalid json file";
    private static Plugin installedPlugin;
    private static String orgId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;

    private Flux<ActionDTO> getActionsInApplication(Application application) {
        return newPageService
                // fetch the unpublished pages
                .findByApplicationId(application.getId(), READ_PAGES, false)
                .flatMap(page -> newActionService.getUnpublishedActions(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId()))), ""));
    }

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
    public void createExportAppJsonWithoutActionsAndDatasourceTest() {

        final Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(testAppId, "");

        StepVerifier.create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<Datasource> datasourceList = applicationJson.getDatasourceList();

                    NewPage defaultPage = pageList.get(0);

                    assertThat(exportedApp.getId()).isNull();
                    assertThat(exportedApp.getOrganizationId()).isNull();
                    assertThat(exportedApp.getPages()).isNull();
                    assertThat(exportedApp.getPolicies()).isNull();
                    assertThat(exportedApp.getUserPermissions()).isNull();

                    assertThat(pageList.isEmpty()).isFalse();
                    assertThat(defaultPage.getApplicationId()).isNull();
                    assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getLayoutOnLoadActions()).isNull();

                    assertThat(actionList.isEmpty()).isTrue();

                    assertThat(datasourceList.isEmpty()).isTrue();
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
                    assertThat(applicationJson.getDecryptedFields()).isEmpty();
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
                            .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                            .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
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
                    assertThat(actionList).hasSize(2);
                    NewAction validAction = actionList.get(0).getPluginType().equals(PluginType.JS) ?
                            actionList.get(1) :
                            actionList.get(0);
                    assertThat(validAction.getApplicationId()).isNull();
                    assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                    assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                    assertThat(validAction.getOrganizationId()).isNull();
                    assertThat(validAction.getPolicies()).isNull();
                    assertThat(validAction.getId()).isNotNull();
                    ActionDTO unpublishedAction = validAction.getUnpublishedAction();
                    assertThat(unpublishedAction.getPageId()).isEqualTo(defaultPage.getUnpublishedPage().getName());
                    assertThat(unpublishedAction.getDatasource().getPluginId()).isEqualTo(installedPlugin.getPackageName());

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
                    assertThat(datasource.getDatasourceConfiguration().getAuthentication()).isNull();

                    DecryptedSensitiveFields decryptedFields = applicationJson.getDecryptedFields().get(datasource.getName());

                    DBAuth auth = (DBAuth) datasourceMap.get("DS2").getDatasourceConfiguration().getAuthentication();
                    assertThat(decryptedFields.getAuthType()).isEqualTo(auth.getClass().getName());
                    assertThat(decryptedFields.getPassword()).isEqualTo("awesome-password");

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

                assertThat(applicationJson.getFileFormatVersion()).isNotNull();
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

        Mono<Application> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId, filepart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }
    
    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationWithNullOrganizationIdTest() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        
        Mono<Application> resultMono = importExportApplicationService
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
        Mono<Application> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);
        
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
        Mono<Application> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);
        
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
    
        final Mono<Application> resultMono = organizationService
            .create(newOrganization)
            .flatMap(organization -> importExportApplicationService
                .extractFileAndSaveApplication(organization.getId(), filePart)
            );
        
        StepVerifier
            .create(resultMono
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                )))
            .assertNext(tuple -> {
                final Application application = tuple.getT1();
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

                assertThat(datasourceList).isNotEmpty();
                datasourceList.forEach(datasource -> {
                    assertThat(datasource.getOrganizationId()).isEqualTo(application.getOrganizationId());
                    if (datasource.getName().contains("wo-auth")) {
                        assertThat(datasource.getDatasourceConfiguration().getAuthentication()).isNull();
                    } else if (datasource.getName().contains("db")) {
                        DBAuth auth = (DBAuth) datasource.getDatasourceConfiguration().getAuthentication();
                        assertThat(auth).isNotNull();
                        assertThat(auth.getPassword()).isNotNull();
                        assertThat(auth.getUsername()).isNotNull();
                    }
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

        final Mono<Application> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                themeRepository.findById(application.getEditModeThemeId()),
                                themeRepository.findById(application.getPublishedModeThemeId())
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
                    Theme editTheme = tuple.getT2();
                    Theme publishedTheme = tuple.getT3();

                    assertThat(editTheme.isSystemTheme()).isFalse();
                    assertThat(editTheme.getName()).isEqualTo("Custom edit theme");

                    assertThat(publishedTheme.isSystemTheme()).isFalse();
                    assertThat(publishedTheme.getName()).isEqualTo("Custom published theme");
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

        final Mono<Application> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
                                getActionsInApplication(application).collectList(),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false
                                        , MANAGE_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
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
                        if (datasource.getName().contains("wo-auth")) {
                            assertThat(datasource.getDatasourceConfiguration().getAuthentication()).isNull();
                        } else if (datasource.getName().contains("db")) {
                            DBAuth auth = (DBAuth) datasource.getDatasourceConfiguration().getAuthentication();
                            assertThat(auth).isNotNull();
                            assertThat(auth.getPassword()).isNotNull();
                            assertThat(auth.getUsername()).isNotNull();
                        }
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

        final Mono<Application> resultMono = organizationService.create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono)
                .assertNext(application -> {
                    assertThat(application.getEditModeThemeId()).isNotEmpty();
                    assertThat(application.getPublishedModeThemeId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplication_withoutPageIdInActionCollection_succeeds() {

        FilePart filePart = createFilePart("test_assets/ImportExportServiceTest/invalid-application-without-pageId-action-collection.json");

        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");

        final Mono<Application> resultMono = organizationService
                .create(newOrganization)
                .flatMap(organization -> importExportApplicationService
                        .extractFileAndSaveApplication(organization.getId(), filePart)
                );

        StepVerifier
                .create(resultMono
                        .flatMap(application -> Mono.zip(
                                Mono.just(application),
                                datasourceService.findAllByOrganizationId(application.getOrganizationId(), MANAGE_DATASOURCES).collectList(),
                                getActionsInApplication(application).collectList(),
                                newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                                actionCollectionService
                                        .findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
                        )))
                .assertNext(tuple -> {
                    final Application application = tuple.getT1();
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

        Application savedApplication = applicationPageService.createApplication(testApplication, orgId).block();

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
        Mono<Application> resultMono = importExportApplicationService.extractFileAndSaveApplication(orgId,filePart);

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INCOMPATIBLE_IMPORTED_JSON.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
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

        Application application = applicationPageService.createApplication(testApplication, orgId).block();
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

        Application application = applicationPageService.createApplication(testApplication, orgId).block();

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
    
}
