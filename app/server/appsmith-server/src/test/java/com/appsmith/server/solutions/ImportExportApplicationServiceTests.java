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
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
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
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
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

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ImportExportApplicationServiceTests {

    @Autowired
    private ImportExportApplicationService importExportApplicationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private UserService userService;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private NewActionService newActionService;
    
    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private static final String INVALID_JSON_FILE = "invalid json file";
    private Plugin installedPlugin;
    private String orgId;
    private String testAppId;
    private Datasource jsDatasource;
    private Map<String, Datasource> datasourceMap = new HashMap<>();
    private Plugin installedJsPlugin;

    private Flux<ActionDTO> getActionsInApplication(Application application) {
        return newPageService
                // fetch the unpublished pages
                .findByApplicationId(application.getId(), READ_PAGES, false)
                .flatMap(page -> newActionService.getUnpublishedActions(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
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

        final Datasource ds2 = new Datasource();
        ds2.setName("DS2");
        ds2.setPluginId(installedPlugin.getId());
        ds2.setDatasourceConfiguration(new DatasourceConfiguration());
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        ds2.getDatasourceConfiguration().setAuthentication(auth);

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS datasource");
        jsDatasource.setOrganizationId(orgId);
        installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());

        datasourceMap.put("DS1", ds1);
        datasourceMap.put("DS2", ds2);
    }
    
    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationWithNullApplicationIdTest() {
        Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(null);
        
        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
            .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void exportApplicationById_WhenContainsInternalFields_InternalFieldsNotExported() {
        Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(testAppId);

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson -> {
                    Application exportedApplication = applicationJson.getExportedApplication();
                    assertThat(exportedApplication.getModifiedBy()).isNull();
                    assertThat(exportedApplication.getLastUpdateTime()).isNull();
                    assertThat(exportedApplication.getLastDeployedAt()).isNull();
                    assertThat(exportedApplication.getGitApplicationMetadata()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonWithoutActionsAndDatasourceTest() {

        final Mono<ApplicationJson> resultMono = importExportApplicationService.exportApplicationById(testAppId);

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
                    assertThat(exportedApp.getPolicies().size()).isEqualTo(0);
                    assertThat(exportedApp.getUserPermissions()).contains(EXPORT_APPLICATIONS.getValue());

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

                    return Mono.zip(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2),
                            applicationPageService.createApplication(testApplication, orgId)
                    );
                })
                .flatMap(tuple -> importExportApplicationService.exportApplicationById(tuple.getT3().getId()));

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
    public void createExportAppJsonWithActionsAndDatasourceTest() {
        
        Organization newOrganization = new Organization();
        newOrganization.setName("template-org-with-ds");
        
        Application testApplication = new Application();
        testApplication.setName("ApplicationWithActionsAndDatasource");

        final Mono<ApplicationJson> resultMono = organizationService.create(newOrganization)
                .zipWhen(org -> applicationPageService.createApplication(testApplication, org.getId()))
                .flatMap(tuple -> {

                    Organization organization = tuple.getT1();
                    Application testApp = tuple.getT2();

                    final Datasource ds1 = datasourceMap.get("DS1");
                    ds1.setOrganizationId(organization.getId());

                    final Datasource ds2 = datasourceMap.get("DS2");
                    ds2.setOrganizationId(organization.getId());

                    final String pageId = testApp.getPages().get(0).getId();

                    return Mono.zip(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2),
                            Mono.just(testApp),
                            newPageService.findPageById(pageId, READ_PAGES, false)
                    );
                })
                .flatMap(tuple -> {

                    Datasource ds1 = tuple.getT1();
                    Datasource ds2 = tuple.getT2();
                    Application testApp = tuple.getT3();
                    PageDTO testPage = tuple.getT4();

                    Layout layout = testPage.getLayouts().get(0);
                    JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));

                    JSONObject dsl2 = new JSONObject();
                    dsl2.put("widgetName", "Table1");
                    dsl2.put("type", "TABLE_WIDGET");
                    Map<String, Object> primaryColumns = new HashMap<>();
                    JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
                    primaryColumns.put("_id", "{{ query1.data }}");
                    primaryColumns.put("_class", jsonObject);
                    dsl2.put("primaryColumns", primaryColumns);
                    final ArrayList<Object> objects = new ArrayList<>();
                    JSONArray temp2 = new JSONArray();
                    temp2.addAll(List.of(new JSONObject(Map.of("key", "primaryColumns._id"))));
                    dsl2.put("dynamicBindingPathList", temp2);
                    objects.add(dsl2);
                    dsl.put("children", objects);

                    layout.setDsl(dsl);
                    layout.setPublishedDsl(dsl);

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(testPage.getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(ds2);

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
                            .then(importExportApplicationService.exportApplicationById(testApp.getId()));
                });

        StepVerifier
                .create(resultMono)
                .assertNext(applicationJson -> {

                    Application exportedApp = applicationJson.getExportedApplication();
                    List<NewPage> pageList = applicationJson.getPageList();
                    List<NewAction> actionList = applicationJson.getActionList();
                    List<ActionCollection> actionCollectionList = applicationJson.getActionCollectionList();
                    List<Datasource> datasourceList = applicationJson.getDatasourceList();

                    NewPage defaultPage = pageList.get(0);

                    assertThat(exportedApp.getName()).isEqualTo(testApplication.getName());
                    assertThat(exportedApp.getOrganizationId()).isNull();
                    assertThat(exportedApp.getPages()).isNull();

                    assertThat(exportedApp.getPolicies()).hasSize(0);

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

                    DecryptedSensitiveFields decryptedFields =
                            applicationJson.getDecryptedFields().get(datasource.getName());

                    DBAuth auth = (DBAuth) datasourceMap.get("DS2").getDatasourceConfiguration().getAuthentication();
                    assertThat(decryptedFields.getAuthType()).isEqualTo(auth.getClass().getName());
                    assertThat(decryptedFields.getPassword()).isEqualTo("awesome-password");

                    assertThat(applicationJson.getUnpublishedLayoutmongoEscapedWidgets()).isNotEmpty();
                    assertThat(applicationJson.getPublishedLayoutmongoEscapedWidgets()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createExportAppJsonForGitTest() {

        final Mono<ApplicationJson> resultMono = Mono.zip(
                organizationService.getById(orgId),
                applicationService.findById(testAppId)
            )
            .flatMap(tuple -> {

                Organization organization = tuple.getT1();
                Application testApp = tuple.getT2();

                final Datasource ds1 = datasourceMap.get("DS1");
                ds1.setOrganizationId(organization.getId());

                final String pageId = testApp.getPages().get(0).getId();

                return Mono.zip(
                    datasourceService.create(ds1),
                    Mono.just(testApp),
                    newPageService.findPageById(pageId, READ_PAGES, false)
                );
            })
            .flatMap(tuple -> {
                Datasource ds1 = tuple.getT1();
                Application testApp = tuple.getT2();
                PageDTO testPage = tuple.getT3();

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
                    .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                    .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                    .then(importExportApplicationService.exportApplicationById(testApp.getId(), SerialiseApplicationObjective.VERSION_CONTROL));
            });

        StepVerifier
            .create(resultMono)
            .assertNext(applicationJson -> {

                Application exportedApp = applicationJson.getExportedApplication();
                List<NewPage> pageList = applicationJson.getPageList();
                List<NewAction> actionList = applicationJson.getActionList();
                List<Datasource> datasourceList = applicationJson.getDatasourceList();

                NewPage defaultPage = pageList.get(0);

                assertThat(exportedApp.getName()).isNotNull();
                assertThat(exportedApp.getOrganizationId()).isNull();
                assertThat(exportedApp.getPages()).isNull();

                assertThat(exportedApp.getPolicies()).hasSize(0);

                assertThat(pageList).hasSize(1);
                assertThat(defaultPage.getApplicationId()).isNull();
                assertThat(defaultPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isNotNull();
                assertThat(defaultPage.getId()).isNull();
                assertThat(defaultPage.getPolicies()).isEmpty();

                assertThat(actionList.isEmpty()).isFalse();
                NewAction validAction = actionList.get(0);
                assertThat(validAction.getApplicationId()).isNull();
                assertThat(validAction.getPluginId()).isEqualTo(installedPlugin.getPackageName());
                assertThat(validAction.getPluginType()).isEqualTo(PluginType.API);
                assertThat(validAction.getOrganizationId()).isNull();
                assertThat(validAction.getPolicies()).isNull();
                assertThat(validAction.getId()).isNotNull();
                assertThat(validAction.getUnpublishedAction().getPageId())
                    .isEqualTo(defaultPage.getUnpublishedPage().getName());

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
                        getActionsInApplication(application).collectList(),
                        newPageService.findByApplicationId(application.getId(), MANAGE_PAGES, false).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, MANAGE_ACTIONS, null).collectList()
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

                assertThat(actionCollectionList).isNotEmpty();
                actionCollectionList.forEach(actionCollection -> {
                    assertThat(actionCollection.getUnpublishedCollection().getPageId()).isNotEqualTo(pageList.get(0).getName());
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
    
}
