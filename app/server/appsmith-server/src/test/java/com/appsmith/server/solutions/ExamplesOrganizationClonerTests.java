package com.appsmith.server.solutions;

import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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
    UserService userService;

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
    private ActionService actionService;

    @Autowired
    private PageService pageService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private Plugin installedPlugin;

    private static class OrganizationData {
        Organization organization;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<Action> actions = new ArrayList<>();
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
                        examplesOrganizationCloner.cloneOrganizationForUser(tuple.getT1().getId(), tuple.getT2()))
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
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
                    app1.setIsPublic(true);

                    Application app2 = new Application();
                    app2.setOrganizationId(organization.getId());
                    app2.setName("2 - private app");

                    return Mono.when(
                            applicationPageService.createApplication(app1),
                            applicationPageService.createApplication(app2)
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
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
                    app1.setIsPublic(true);

                    Application app2 = new Application();
                    app2.setOrganizationId(organization.getId());
                    app2.setName("2 - another public app more");
                    app2.setIsPublic(true);

                    return Mono.zip(
                            applicationPageService.createApplication(app1),
                            applicationPageService.createApplication(app2).flatMap(application -> {
                                final Page newPage = new Page();
                                newPage.setName("The New Page");
                                newPage.setApplicationId(application.getId());
                                return applicationPageService.createPage(newPage);
                            })
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
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
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).isEmpty();
                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
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

                    return Mono.when(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2)
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.datasources).hasSize(2);
                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

                    final Datasource ds1 = data.datasources.stream()
                            .filter(datasource -> "datasource 1".equals(datasource.getName()))
                            .findFirst()
                            .orElseThrow();
                    assertThat(ds1.getDatasourceConfiguration().getUrl()).isEqualTo("http://httpbin.org/get");
                    assertThat(ds1.getDatasourceConfiguration().getHeaders()).containsOnly(
                            new Property("X-Answer", "42")
                    );

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

                    return Mono.when(
                            applicationPageService.createApplication(app1),
                            applicationPageService.createApplication(app2),
                            datasourceService.create(ds1),
                            datasourceService.create(ds2)
                    ).then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    assertThat(data.datasources).hasSize(2);
                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

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
                                final Datasource ds1Again = tuple1.getT3();

                                final Action action1 = new Action();
                                action1.setName("action1");
                                action1.setPageId(pageId1);
                                action1.setOrganizationId(organization.getId());
                                action1.setDatasource(ds1Again);
                                action1.setPluginId(installedPlugin.getId());

                                final Action action2 = new Action();
                                action2.setPageId(pageId1);
                                action2.setName("action2");
                                action2.setOrganizationId(organization.getId());
                                action2.setDatasource(ds1Again);
                                action2.setPluginId(installedPlugin.getId());

                                final Application app2Again = tuple1.getT2();
                                final String pageId2 = app2Again.getPages().get(0).getId();
                                final Datasource ds2Again = tuple1.getT4();

                                final Action action3 = new Action();
                                action3.setName("action3");
                                action3.setPageId(pageId2);
                                action3.setOrganizationId(organization.getId());
                                action3.setDatasource(ds2Again);
                                action3.setPluginId(installedPlugin.getId());

                                final Action action4 = new Action();
                                action4.setPageId(pageId2);
                                action4.setName("action4");
                                action4.setOrganizationId(organization.getId());
                                action4.setDatasource(ds2Again);
                                action4.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                        actionCollectionService.createAction(action1),
                                        actionCollectionService.createAction(action2),
                                        actionCollectionService.createAction(action3),
                                        actionCollectionService.createAction(action4)
                                );
                            })
                            .then(examplesOrganizationCloner.cloneOrganizationForUser(organization.getId(), tuple.getT2()));
                })
                .flatMap(this::loadOrganizationData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.organization).isNotNull();
                    assertThat(data.organization.getId()).isNotNull();
                    assertThat(data.organization.getName()).isEqualTo("api_user's Examples");
                    assertThat(data.organization.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    assertThat(data.datasources).hasSize(2);
                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

                    assertThat(data.actions).hasSize(4);
                    assertThat(map(data.actions, Action::getName)).containsExactlyInAnyOrder(
                            "action1",
                            "action2",
                            "action3",
                            "action4"
                    );
                })
                .verifyComplete();
    }

    private <InType, OutType> List<OutType> map(List<InType> list, Function<InType, OutType> fn) {
        return list.stream().map(fn).collect(Collectors.toList());
    }

    private Flux<Action> getActionsInOrganization(Organization organization) {
        return applicationService
                .findByOrganizationId(organization.getId(), READ_APPLICATIONS)
                .flatMap(application -> pageService.findByApplicationId(application.getId(), READ_PAGES))
                .flatMap(page -> actionService.get(new LinkedMultiValueMap<String, String>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }
}
