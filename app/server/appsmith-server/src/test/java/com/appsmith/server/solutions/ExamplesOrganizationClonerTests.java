package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.PEMCertificate;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpMethod;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class ExamplesOrganizationClonerTests {

    @Autowired
    private ExamplesOrganizationCloner examplesOrganizationCloner;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NewPageService newPageService;

    private Plugin installedPlugin;

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    public Mono<OrganizationData> loadOrganizationData(Organization organization) {
        final OrganizationData data = new OrganizationData();
        data.organization = organization;

        return Mono
                .when(
                        applicationService
                                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .findAllByOrganizationId(organization.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInOrganization(organization)
                                .map(data.actions::add)
                )
                .thenReturn(data);
    }

    @Before
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneEmptyOrganization() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");
        final Mono<OrganizationData> resultMono = organizationService.create(newOrganization)
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(tuple ->
                        examplesOrganizationCloner.cloneOrganizationForUser(tuple.getT1().getId(), tuple.getT2(), Flux.empty()))
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).isEmpty();
                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithItsContents() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();
                    Application app1 = new Application();
                    app1.setName("1 - public app");
                    app1.setOrganizationId(organization.getId());

                    Application app2 = new Application();
                    app2.setOrganizationId(organization.getId());
                    app2.setName("2 - private app");

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2)
                            )
                            .flatMap(tuple1 ->
                                    examplesOrganizationCloner.cloneOrganizationForUser(
                                            organization.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1()})
                                    )
                            );
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(1);
                    assertThat(map(data.applications, Application::getName)).containsExactly("1 - public app");
                    assertThat(data.applications.get(0).getPages()).hasSize(1);

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithOnlyPublicApplications() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 2");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    Application app1 = new Application();
                    app1.setName("1 - public app more");
                    app1.setOrganizationId(organization.getId());

                    Application app2 = new Application();
                    app2.setOrganizationId(organization.getId());
                    app2.setName("2 - another public app more");
                    app2.setIsPublic(true);

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2).flatMap(application -> {
                                        final PageDTO newPage = new PageDTO();
                                        newPage.setName("The New Page");
                                        newPage.setApplicationId(application.getId());
                                        return applicationPageService.createPage(newPage).thenReturn(application);
                                    })
                            )
                            .flatMap(tuple1 ->
                                    examplesOrganizationCloner.cloneOrganizationForUser(
                                            organization.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1(), tuple1.getT2()})
                                    )
                            );
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "1 - public app more",
                            "2 - another public app more"
                    );

                    for (final Application app : data.applications) {
                        if ("2 - another public app more".equals(app.getName())) {
                            assertThat(app.getPages()).hasSize(2);
                        } else {
                            assertThat(app.getPages()).hasSize(1);
                        }
                    }

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithOnlyPrivateApplications() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 2");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    Application app1 = new Application();
                    app1.setName("1 - private app more");
                    app1.setOrganizationId(organization.getId());

                    Application app2 = new Application();
                    app2.setOrganizationId(organization.getId());
                    app2.setName("2 - another private app more");

                    return Mono.when(
                            applicationPageService.createApplication(app1),
                            applicationPageService.createApplication(app2)
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2(), Flux.empty()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).isEmpty();
                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationMultipleTimes() {
        Organization sourceOrg = new Organization();
        sourceOrg.setName("Source Org 1");

        Organization targetOrg = new Organization();
        targetOrg.setName("Target Org 1");

        final Mono<List<String>> resultMono = Mono
                .zip(
                        organizationService.create(sourceOrg),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization sourceOrg1 = tuple.getT1();
                    Application app1 = new Application();
                    app1.setName("awesome app");
                    app1.setOrganizationId(sourceOrg1.getId());

                    return Mono.zip(
                            applicationPageService.createApplication(app1),
                            organizationService.create(targetOrg)
                    );
                })
                .flatMapMany(tuple -> {
                    final String orgId = tuple.getT2().getId();
                    final String originalId = tuple.getT1().getId();
                    final String originalName = tuple.getT1().getName();

                    Mono<Void> cloneMono = Mono.just(tuple.getT1())
                            .map(app -> {
                                // We reset these values here because the clone method updates them and that just messes with our test.
                                app.setId(originalId);
                                app.setName(originalName);
                                return app;
                            })
                            .flatMap(app -> examplesOrganizationCloner.cloneApplications(orgId, Flux.fromArray(new Application[]{ app })))
                            .then();
                    // Clone this application into the same organization thrice.
                    return cloneMono
                            .then(cloneMono)
                            .then(cloneMono)
                            .thenMany(Flux.defer(() -> applicationRepository.findByOrganizationId(orgId)));
                })
                .map(Application::getName)
                .collectList();

        StepVerifier.create(resultMono)
                .assertNext(names -> {
                    assertThat(names).hasSize(3);
                    assertThat(names).containsExactlyInAnyOrder("awesome app", "awesome app (1)", "awesome app (2)");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithOnlyDatasources() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 2");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setOrganizationId(organization.getId());
                    final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    ds1.setDatasourceConfiguration(datasourceConfiguration);
                    datasourceConfiguration.setUrl("http://httpbin.org/get");
                    datasourceConfiguration.setHeaders(List.of(
                            new Property("X-Answer", "42")
                    ));

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setOrganizationId(organization.getId());
                    ds2.setDatasourceConfiguration(new DatasourceConfiguration());
                    DBAuth auth = new DBAuth();
                    auth.setPassword("answer-to-life");
                    ds2.getDatasourceConfiguration().setAuthentication(auth);

                    return Mono.when(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2)
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2(), Flux.empty()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.applications).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithDatasourcesAndApplications() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 2");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("first application");
                    app1.setOrganizationId(organization.getId());
                    app1.setIsPublic(true);

                    final Application app2 = new Application();
                    app2.setName("second application");
                    app2.setOrganizationId(organization.getId());
                    app2.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setOrganizationId(organization.getId());

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setOrganizationId(organization.getId());

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2)
                            )
                            .flatMap(tuple1 ->
                                    examplesOrganizationCloner.cloneOrganizationForUser(
                                            organization.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1(), tuple1.getT2()})
                                    )
                            );
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneOrganizationWithDatasourcesAndApplicationsAndActions() {
        Organization newOrganization = new Organization();
        newOrganization.setName("Template Organization 2");
        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(newOrganization),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization organization = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("first application");
                    app1.setOrganizationId(organization.getId());
                    app1.setIsPublic(true);

                    final Application app2 = new Application();
                    app2.setName("second application");
                    app2.setOrganizationId(organization.getId());
                    app2.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setOrganizationId(organization.getId());
                    ds1.setPluginId(installedPlugin.getId());

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setOrganizationId(organization.getId());
                    ds2.setPluginId(installedPlugin.getId());

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2)
                            )
                            .flatMap(tuple1 -> {
                                final Application app = tuple1.getT1();
                                final String pageId1 = app.getPages().get(0).getId();
                                final Datasource ds1WithId = tuple1.getT3();

                                final PageDTO newPage = new PageDTO();
                                newPage.setName("A New Page");
                                newPage.setApplicationId(app.getId());
                                newPage.setLayouts(new ArrayList<>());
                                final Layout layout = new Layout();
                                layout.setId(new ObjectId().toString());
                                JSONObject dsl = new JSONObject();
                                dsl.put("widgetName", "testWidget");
                                JSONArray temp = new JSONArray();
                                temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
                                dsl.put("dynamicBindingPathList", temp);
                                dsl.put("testField", "draft {{ newPageAction.data }}");
                                layout.setDsl(dsl);
                                JSONObject publishedDsl = new JSONObject(dsl);
                                publishedDsl.put("testField", "published {{ newPageAction.data }}");
                                layout.setPublishedDsl(publishedDsl);
                                final DslActionDTO actionDTO = new DslActionDTO();
                                final HashSet<DslActionDTO> dslActionDTOS = new HashSet<>(List.of(actionDTO));
                                layout.setLayoutOnLoadActions(List.of(dslActionDTOS));
                                newPage.getLayouts().add(layout);

                                final ActionDTO newPageAction = new ActionDTO();
                                newPageAction.setName("newPageAction");
                                newPageAction.setOrganizationId(organization.getId());
                                newPageAction.setDatasource(ds1WithId);
                                newPageAction.setPluginId(installedPlugin.getId());
                                newPageAction.setActionConfiguration(new ActionConfiguration());
                                newPageAction.getActionConfiguration().setHttpMethod(HttpMethod.GET);

                                final ActionDTO action1 = new ActionDTO();
                                action1.setName("action1");
                                action1.setPageId(pageId1);
                                action1.setOrganizationId(organization.getId());
                                action1.setDatasource(ds1WithId);
                                action1.setPluginId(installedPlugin.getId());

                                final ActionDTO action2 = new ActionDTO();
                                action2.setPageId(pageId1);
                                action2.setName("action2");
                                action2.setOrganizationId(organization.getId());
                                action2.setDatasource(ds1WithId);
                                action2.setPluginId(installedPlugin.getId());

                                final Application app2Again = tuple1.getT2();
                                final String pageId2 = app2Again.getPages().get(0).getId();
                                final Datasource ds2WithId = tuple1.getT4();

                                final ActionDTO action3 = new ActionDTO();
                                action3.setName("action3");
                                action3.setPageId(pageId2);
                                action3.setOrganizationId(organization.getId());
                                action3.setDatasource(ds2WithId);
                                action3.setPluginId(installedPlugin.getId());

                                final ActionDTO action4 = new ActionDTO();
                                action4.setPageId(pageId2);
                                action4.setName("action4");
                                action4.setOrganizationId(organization.getId());
                                action4.setDatasource(ds2WithId);
                                action4.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                        applicationPageService.createPage(newPage)
                                                .flatMap(page -> {
                                                    newPageAction.setPageId(page.getId());
                                                    return applicationPageService.addPageToApplication(app, page, false)
                                                            .then(actionCollectionService.createAction(newPageAction))
                                                            .flatMap(savedAction -> layoutActionService.updateAction(savedAction.getId(), savedAction))
                                                            .then(newPageService.findPageById(page.getId(), READ_PAGES, false));
                                                })
                                                .map(tuple2 -> {
                                                    log.info("Created action and added page to app {}", tuple2);
                                                    return tuple2;
                                                }),
                                        actionCollectionService.createAction(action1),
                                        actionCollectionService.createAction(action2),
                                        actionCollectionService.createAction(action3),
                                        actionCollectionService.createAction(action4)
                                ).thenReturn(List.of(tuple1.getT1(), tuple1.getT2()));
                            })
                            .flatMap(applications ->
                                    examplesOrganizationCloner.cloneOrganizationForUser(
                                            organization.getId(),
                                            tuple.getT2(),
                                            Flux.fromIterable(applications)
                                    )
                            );
                })
                .doOnError(error -> log.error("Error preparing data for test", error))
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's apps");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    final Application firstApplication = data.applications.stream().filter(app -> app.getName().equals("first application")).findFirst().orElse(null);
                    assert firstApplication != null;
                    assertThat(firstApplication.getPages().stream().filter(ApplicationPage::isDefault).count()).isEqualTo(1);
                    final NewPage newPage = mongoTemplate.findOne(Query.query(Criteria.where("applicationId").is(firstApplication.getId()).and("unpublishedPage.name").is("A New Page")), NewPage.class);
                    assert newPage != null;
                    log.debug("new page is : {}", newPage.toString());
                    final String actionId = newPage.getUnpublishedPage().getLayouts().get(0).getLayoutOnLoadActions().get(0).iterator().next().getId();
                    final NewAction newPageAction = mongoTemplate.findOne(Query.query(Criteria.where("id").is(actionId)), NewAction.class);
                    assert newPageAction != null;
                    assertThat(newPageAction.getOrganizationId()).isEqualTo(data.organization.getId());

                    assertThat(data.datasources).hasSize(2);
                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

                    assertThat(data.actions).hasSize(5);
                    assertThat(getUnpublishedActionName(data.actions)).containsExactlyInAnyOrder(
                            "newPageAction",
                            "action1",
                            "action2",
                            "action3",
                            "action4"
                    );
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationWithActionsThrice() {
        Organization sourceOrg = new Organization();
        sourceOrg.setName("Source Org 2");

        Organization targetOrg = new Organization();
        targetOrg.setName("Target Org 2");

        final Mono<OrganizationData> resultMono = Mono
                .zip(
                        organizationService.create(sourceOrg),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Organization sourceOrg1 = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("that great app");
                    app1.setOrganizationId(sourceOrg1.getId());
                    app1.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setOrganizationId(sourceOrg1.getId());
                    ds1.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc = new DatasourceConfiguration();
                    ds1.setDatasourceConfiguration(dc);

                    dc.setConnection(new Connection(
                            Connection.Mode.READ_WRITE,
                            Connection.Type.DIRECT,
                            new SSLDetails(
                                    SSLDetails.AuthType.ALLOW,
                                    new UploadedFile("keyFile", "key file content"),
                                    new UploadedFile("certFile", "cert file content"),
                                    new UploadedFile("caCertFile", "caCert file content"),
                                    true,
                                    new PEMCertificate(
                                            new UploadedFile(
                                                    "pemCertFile",
                                                    "pem cert file content"
                                            ),
                                            "pem cert file password"
                                    )
                            ),
                            "default db"
                    ));

                    dc.setEndpoints(List.of(
                            new Endpoint("host1", 1L),
                            new Endpoint("host2", 2L)
                    ));

                    final DBAuth auth = new DBAuth(
                            DBAuth.Type.USERNAME_PASSWORD,
                            "db username",
                            "db password",
                            "db name"
                    );
                    auth.setCustomAuthenticationParameters(Set.of(
                            new Property("custom auth param 1", "custom auth param value 1"),
                            new Property("custom auth param 2", "custom auth param value 2")
                    ));
                    auth.setIsAuthorized(true);
                    auth.setAuthenticationResponse(new AuthenticationResponse("token", "refreshToken", Instant.now(), Instant.now(), null));
                    dc.setAuthentication(auth);

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setOrganizationId(sourceOrg1.getId());
                    ds2.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc2 = new DatasourceConfiguration();
                    ds2.setDatasourceConfiguration(dc2);
                    dc2.setAuthentication(new OAuth2(
                            OAuth2.Type.CLIENT_CREDENTIALS,
                            true,
                            true,
                            "client id",
                            "client secret",
                            "auth url",
                            "access token url",
                            "scope",
                            Set.of("scope1", "scope2", "scope3"),
                            "header prefix",
                            Set.of(
                                    new Property("custom token param 1", "custom token param value 1"),
                                    new Property("custom token param 2", "custom token param value 2")
                            )
                    ));

                    final Datasource ds3 = new Datasource();
                    ds3.setName("datasource 3");
                    ds3.setOrganizationId(sourceOrg1.getId());
                    ds3.setPluginId(installedPlugin.getId());

                    return applicationPageService.createApplication(app1)
                            .flatMap(createdApp -> Mono.zip(
                                    Mono.just(createdApp),
                                    newPageRepository.findByApplicationId(createdApp.getId()).collectList(),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2),
                                    datasourceService.create(ds3)
                            ))
                            .flatMap(tuple1 -> {
                                final Application app = tuple1.getT1();
                                final List<NewPage> pages = tuple1.getT2();
                                final Datasource ds1WithId = tuple1.getT3();
                                final Datasource ds2WithId = tuple1.getT4();

                                final NewPage firstPage = pages.get(0);

                                final ActionDTO action1 = new ActionDTO();
                                action1.setName("action1");
                                action1.setPageId(firstPage.getId());
                                action1.setOrganizationId(sourceOrg1.getId());
                                action1.setDatasource(ds1WithId);
                                action1.setPluginId(installedPlugin.getId());

                                final ActionDTO action2 = new ActionDTO();
                                action2.setPageId(firstPage.getId());
                                action2.setName("action2");
                                action2.setOrganizationId(sourceOrg1.getId());
                                action2.setDatasource(ds1WithId);
                                action2.setPluginId(installedPlugin.getId());

                                final ActionDTO action3 = new ActionDTO();
                                action3.setPageId(firstPage.getId());
                                action3.setName("action3");
                                action3.setOrganizationId(sourceOrg1.getId());
                                action3.setDatasource(ds2WithId);
                                action3.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                        actionCollectionService.createAction(action1),
                                        actionCollectionService.createAction(action2),
                                        actionCollectionService.createAction(action3)
                                ).then(Mono.zip(
                                        organizationService.create(targetOrg),
                                        Mono.just(app)
                                ));
                            })
                            .flatMap(tuple1 -> {
                                final Organization targetOrg1 = tuple1.getT1();
                                final String originalId = tuple1.getT2().getId();
                                final String originalName = tuple1.getT2().getName();

                                Mono<Void> clonerMono = Mono.just(tuple1.getT2())
                                        .map(app -> {
                                            // We reset these values here because the clone method updates them and that just messes with our test.
                                            app.setId(originalId);
                                            app.setName(originalName);
                                            return app;
                                        })
                                        .flatMap(app -> examplesOrganizationCloner.cloneApplications(
                                                targetOrg1.getId(),
                                                Flux.fromArray(new Application[]{ app })
                                        ))
                                        .then();

                                return clonerMono
                                        .then(clonerMono)
                                        .then(clonerMono)
                                        .thenReturn(targetOrg1);
                            });
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("Target Org 2");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "that great app",
                            "that great app (1)",
                            "that great app (2)"
                    );

                    final Application app1 = data.applications.stream().filter(app -> app.getName().equals("that great app")).findFirst().orElse(null);
                    assert app1 != null;
                    assertThat(app1.getPages().stream().filter(ApplicationPage::isDefault).count()).isEqualTo(1);

                    final DBAuth a1 = new DBAuth();
                    a1.setUsername("u1");
                    final DBAuth a2 = new DBAuth();
                    a2.setUsername("u1");
                    assertThat(a1).isEqualTo(a2);

                    final OAuth2 o1 = new OAuth2();
                    o1.setClientId("c1");
                    final OAuth2 o2 = new OAuth2();
                    o2.setClientId("c1");
                    assertThat(o1).isEqualTo(o2);

                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

                    final Datasource ds1 = data.datasources.stream().filter(ds -> ds.getName().equals("datasource 1")).findFirst().get();
                    assertThat(ds1.getDatasourceConfiguration().getAuthentication().getIsAuthorized()).isNull();
                    assertThat(ds1.getDatasourceConfiguration().getAuthentication().getAuthenticationResponse()).isNull();

                    final Datasource ds2 = data.datasources.stream().filter(ds -> ds.getName().equals("datasource 2")).findFirst().get();
                    assertThat(ds2.getDatasourceConfiguration().getAuthentication().getIsAuthorized()).isNull();
                    assertThat(ds2.getDatasourceConfiguration().getAuthentication().getAuthenticationResponse()).isNull();

                    assertThat(getUnpublishedActionName(data.actions)).containsExactlyInAnyOrder(
                            "action1",
                            "action2",
                            "action3",
                            "action1",
                            "action2",
                            "action3",
                            "action1",
                            "action2",
                            "action3"
                    );
                })
                .verifyComplete();
    }

    private List<String> getUnpublishedActionName(List<ActionDTO> actions) {
        List<String> names = new ArrayList<>();
        for (ActionDTO action : actions) {
            names.add(action.getName());
        }
        return names;
    }

    private <InType, OutType> List<OutType> map(List<InType> list, Function<InType, OutType> fn) {
        return list.stream().map(fn).collect(Collectors.toList());
    }

    private Flux<ActionDTO> getActionsInOrganization(Organization organization) {
        return applicationService
                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> newActionService.getUnpublishedActions(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }
}
