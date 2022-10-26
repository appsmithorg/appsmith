package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.PEMCertificate;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
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
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import org.springframework.test.context.junit.jupiter.SpringExtension;
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
@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
public class ExamplesWorkspaceClonerTests {

    @Autowired
    private ExamplesWorkspaceCloner examplesWorkspaceCloner;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private WorkspaceService workspaceService;

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

    @MockBean
    PluginExecutor pluginExecutor;

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

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    private static class WorkspaceData {
        Workspace workspace;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
        List<ActionCollectionDTO> actionCollections = new ArrayList<>();
    }

    public Mono<WorkspaceData> loadWorkspaceData(Workspace workspace) {
        final WorkspaceData data = new WorkspaceData();
        data.workspace = workspace;

        return Mono
                .when(
                        applicationService
                                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .findAllByWorkspaceId(workspace.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInWorkspace(workspace)
                                .map(data.actions::add),
                        getActionCollectionsInWorkspace(workspace)
                                .map(data.actionCollections::add)
                )
                .thenReturn(data);
    }

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneEmptyWorkspace() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        final Mono<WorkspaceData> resultMono = workspaceService.create(newWorkspace)
                .zipWith(sessionUserService.getCurrentUser())
                .flatMap(tuple ->
                        examplesWorkspaceCloner.cloneWorkspaceForUser(tuple.getT1().getId(), tuple.getT2(), Flux.empty(), Flux.empty()))
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.applications).isEmpty();
                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithItsContents() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();
                    Application app1 = new Application();
                    app1.setName("1 - public app");
                    app1.setWorkspaceId(workspace.getId());

                    Application app2 = new Application();
                    app2.setWorkspaceId(workspace.getId());
                    app2.setName("2 - private app");

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2)
                            )
                            .flatMap(tuple1 ->
                                    examplesWorkspaceCloner.cloneWorkspaceForUser(
                                            workspace.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1()}),
                                            Flux.empty()
                                    )
                            );
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(1);
                    assertThat(map(data.applications, Application::getName)).containsExactly("1 - public app");
                    assertThat(data.applications.get(0).getPages()).hasSize(1);

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithOnlyPublicApplications() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();

                    Application app1 = new Application();
                    app1.setName("1 - public app more");
                    app1.setWorkspaceId(workspace.getId());

                    Application app2 = new Application();
                    app2.setWorkspaceId(workspace.getId());
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
                                    examplesWorkspaceCloner.cloneWorkspaceForUser(
                                            workspace.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1(), tuple1.getT2()}),
                                            Flux.empty()
                                    )
                            );
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

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
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithOnlyPrivateApplications() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();

                    Application app1 = new Application();
                    app1.setName("1 - private app more");
                    app1.setWorkspaceId(workspace.getId());

                    Application app2 = new Application();
                    app2.setWorkspaceId(workspace.getId());
                    app2.setName("2 - another private app more");

                    return Mono.when(
                            applicationPageService.createApplication(app1),
                            applicationPageService.createApplication(app2)
                    ).then(examplesWorkspaceCloner.cloneWorkspaceForUser(workspace.getId(), tuple.getT2(), Flux.empty(), Flux.empty()));
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.applications).isEmpty();
                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationMultipleTimes() {
        Workspace sourceOrg = new Workspace();
        sourceOrg.setName("Source Org 1");

        Workspace targetOrg = new Workspace();
        targetOrg.setName("Target Org 1");

        final Mono<List<String>> resultMono = Mono
                .zip(
                        workspaceService.create(sourceOrg),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace sourceOrg1 = tuple.getT1();
                    Application app1 = new Application();
                    app1.setName("awesome app");
                    app1.setWorkspaceId(sourceOrg1.getId());

                    return Mono.zip(
                            applicationPageService.createApplication(app1),
                            workspaceService.create(targetOrg)
                    );
                })
                .flatMapMany(tuple -> {
                    final String workspaceId = tuple.getT2().getId();
                    final String originalId = tuple.getT1().getId();
                    final String originalName = tuple.getT1().getName();

                    Mono<Void> cloneMono = Mono.just(tuple.getT1())
                            .map(app -> {
                                // We reset these values here because the clone method updates them and that just messes with our test.
                                app.setId(originalId);
                                app.setName(originalName);
                                return app;
                            })
                            .flatMap(app -> examplesWorkspaceCloner.cloneApplications(workspaceId, Flux.fromArray(new Application[]{app})))
                            .then();
                    // Clone this application into the same workspace thrice.
                    return cloneMono
                            .then(cloneMono)
                            .then(cloneMono)
                            .thenMany(Flux.defer(() -> applicationRepository.findByWorkspaceId(workspaceId)));
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
    public void cloneWorkspaceWithOnlyDatasources() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(workspace.getId());
                    final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    ds1.setDatasourceConfiguration(datasourceConfiguration);
                    datasourceConfiguration.setUrl("http://httpbin.org/get");
                    datasourceConfiguration.setHeaders(List.of(
                            new Property("X-Answer", "42")
                    ));

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setWorkspaceId(workspace.getId());
                    ds2.setDatasourceConfiguration(new DatasourceConfiguration());
                    DBAuth auth = new DBAuth();
                    auth.setPassword("answer-to-life");
                    ds2.getDatasourceConfiguration().setAuthentication(auth);

                    return Mono.when(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2)
                    ).then(examplesWorkspaceCloner.cloneWorkspaceForUser(workspace.getId(), tuple.getT2(), Flux.empty(), Flux.empty()));
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.applications).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithOnlyDatasourcesSpecifiedExplicitly() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(workspace.getId());
                    ds1.setPluginId(installedPlugin.getId());
                    final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    ds1.setDatasourceConfiguration(datasourceConfiguration);
                    datasourceConfiguration.setUrl("http://httpbin.org/get");
                    datasourceConfiguration.setHeaders(List.of(
                            new Property("X-Answer", "42")
                    ));

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setWorkspaceId(workspace.getId());
                    ds2.setPluginId(installedPlugin.getId());
                    ds2.setDatasourceConfiguration(new DatasourceConfiguration());
                    DBAuth auth = new DBAuth();
                    auth.setPassword("answer-to-life");
                    ds2.getDatasourceConfiguration().setAuthentication(auth);

                    return Mono.zip(
                            datasourceService.create(ds1),
                            datasourceService.create(ds2)
                    ).flatMap(tuple1 -> examplesWorkspaceCloner.cloneWorkspaceForUser(
                            workspace.getId(),
                            tuple.getT2(),
                            Flux.empty(),
                            Flux.just(tuple1.getT1())
                    ));
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.datasources).hasSize(1);
                    assertThat(data.datasources.get(0).getName()).isEqualTo("datasource 1");

                    assertThat(data.applications).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithDatasourcesAndApplications() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(newWorkspace),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("first application");
                    app1.setWorkspaceId(workspace.getId());
                    app1.setIsPublic(true);

                    final Application app2 = new Application();
                    app2.setName("second application");
                    app2.setWorkspaceId(workspace.getId());
                    app2.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(workspace.getId());

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setWorkspaceId(workspace.getId());

                    return Mono
                            .zip(
                                    applicationPageService.createApplication(app1),
                                    applicationPageService.createApplication(app2),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2)
                            )
                            .flatMap(tuple1 ->
                                    examplesWorkspaceCloner.cloneWorkspaceForUser(
                                            workspace.getId(),
                                            tuple.getT2(),
                                            Flux.fromArray(new Application[]{tuple1.getT1(), tuple1.getT2()}),
                                            Flux.empty()
                                    )
                            );
                })
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    assertThat(data.datasources).isEmpty();
                    assertThat(data.actions).isEmpty();
                    assertThat(data.actionCollections).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneWorkspaceWithDatasourcesAndApplicationsAndActionsAndCollections() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Template Workspace 2");
        final Workspace workspace = workspaceService.create(newWorkspace).block();
        final User user = sessionUserService.getCurrentUser().block();

        final Application app1 = new Application();
        app1.setName("first application");
        app1.setWorkspaceId(workspace.getId());
        app1.setIsPublic(true);

        final Application app2 = new Application();
        app2.setName("second application");
        app2.setWorkspaceId(workspace.getId());
        app2.setIsPublic(true);

        final Datasource ds1 = new Datasource();
        ds1.setName("datasource 1");
        ds1.setWorkspaceId(workspace.getId());
        ds1.setPluginId(installedPlugin.getId());

        final Datasource ds2 = new Datasource();
        ds2.setName("datasource 2");
        ds2.setWorkspaceId(workspace.getId());
        ds2.setPluginId(installedPlugin.getId());

        final Application app = applicationPageService.createApplication(app1).block();
        final Application app2Again = applicationPageService.createApplication(app2).block();
        final Datasource ds1WithId = datasourceService.create(ds1).block();
        final Datasource ds2WithId = datasourceService.create(ds2).block();

        final String pageId1 = app.getPages().get(0).getId();

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
        newPageAction.setWorkspaceId(workspace.getId());
        newPageAction.setDatasource(ds1WithId);
        newPageAction.setPluginId(installedPlugin.getId());
        newPageAction.setActionConfiguration(new ActionConfiguration());
        newPageAction.getActionConfiguration().setHttpMethod(HttpMethod.GET);

        final ActionDTO action1 = new ActionDTO();
        action1.setName("action1");
        action1.setPageId(pageId1);
        action1.setWorkspaceId(workspace.getId());
        action1.setDatasource(ds1WithId);
        action1.setPluginId(installedPlugin.getId());

        final String pageId2 = app2Again.getPages().get(0).getId();

        final ActionDTO action3 = new ActionDTO();
        action3.setName("action3");
        action3.setPageId(pageId2);
        action3.setWorkspaceId(workspace.getId());
        action3.setDatasource(ds2WithId);
        action3.setPluginId(installedPlugin.getId());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        Datasource jsDatasource = new Datasource();
        jsDatasource.setName("Default Database");
        jsDatasource.setWorkspaceId(workspace.getId());
        Plugin installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());

        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(app.getPages().get(0).getId());
        actionCollectionDTO1.setApplicationId(app.getId());
        actionCollectionDTO1.setWorkspaceId(workspace.getId());
        actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
        ActionDTO action5 = new ActionDTO();
        action5.setName("run");
        action5.setActionConfiguration(new ActionConfiguration());
        action5.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action5));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        applicationPageService.createPage(newPage)
                .flatMap(page -> {
                    newPageAction.setPageId(page.getId());
                    return applicationPageService.addPageToApplication(app, page, false)
                            .then(layoutActionService.createSingleAction(newPageAction))
                            .flatMap(savedAction -> layoutActionService.updateSingleAction(savedAction.getId(), savedAction))
                            .then(newPageService.findPageById(page.getId(), READ_PAGES, false));
                })
                .map(tuple2 -> {
                    log.info("Created action and added page to app {}", tuple2);
                    return tuple2;
                }).block();
        layoutActionService.createSingleAction(action1).block();
        layoutActionService.createSingleAction(action3).block();
        layoutCollectionService.createCollection(actionCollectionDTO1).block();

        final Mono<WorkspaceData> resultMono = examplesWorkspaceCloner.cloneWorkspaceForUser(
                        workspace.getId(),
                        user,
                        Flux.fromIterable(List.of(app, app2Again)),
                        Flux.empty())
                .doOnError(error -> log.error("Error preparing data for test", error))
                .flatMap(this::loadWorkspaceData);

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("api_user's apps");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(data.applications).hasSize(2);
                    assertThat(map(data.applications, Application::getName)).containsExactlyInAnyOrder(
                            "first application",
                            "second application"
                    );

                    final Application firstApplication = data.applications.stream().filter(appFirst -> appFirst.getName().equals("first application")).findFirst().orElse(null);
                    assert firstApplication != null;
                    assertThat(firstApplication.getPages().stream().filter(ApplicationPage::isDefault).count()).isEqualTo(1);
                    final NewPage newPage1 = mongoTemplate.findOne(Query.query(Criteria.where("applicationId").is(firstApplication.getId()).and("unpublishedPage.name").is("A New Page")), NewPage.class);
                    assert newPage1 != null;
                    final String actionId = newPage1.getUnpublishedPage().getLayouts().get(0).getLayoutOnLoadActions().get(0).iterator().next().getId();
                    final NewAction newPageAction1 = mongoTemplate.findOne(Query.query(Criteria.where("id").is(actionId)), NewAction.class);
                    assert newPageAction1 != null;
                    assertThat(newPageAction1.getWorkspaceId()).isEqualTo(data.workspace.getId());

                    assertThat(data.datasources).hasSize(2);
                    assertThat(map(data.datasources, Datasource::getName)).containsExactlyInAnyOrder(
                            "datasource 1",
                            "datasource 2"
                    );

                    assertThat(data.actions).hasSize(3);
                    assertThat(getUnpublishedActionName(data.actions)).containsExactlyInAnyOrder(
                            "newPageAction",
                            "action1",
                            "action3"
                    );
                    assertThat(data.actionCollections).hasSize(1);
                    assertThat(data.actionCollections.get(0).getDefaultToBranchedActionIdsMap()).hasSize(1);
                    assertThat(data.actionCollections.get(0).getActions()).hasSize(1);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationWithActionsThrice() {
        Workspace sourceOrg = new Workspace();
        sourceOrg.setName("Source Org 2");

        Workspace targetOrg = new Workspace();
        targetOrg.setName("Target Org 2");

        final Mono<WorkspaceData> resultMono = Mono
                .zip(
                        workspaceService.create(sourceOrg),
                        sessionUserService.getCurrentUser()
                )
                .flatMap(tuple -> {
                    final Workspace sourceOrg1 = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("that great app");
                    app1.setWorkspaceId(sourceOrg1.getId());
                    app1.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(sourceOrg1.getId());
                    ds1.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc = new DatasourceConfiguration();
                    ds1.setDatasourceConfiguration(dc);

                    dc.setConnection(new Connection(
                            Connection.Mode.READ_WRITE,
                            Connection.Type.DIRECT,
                            new SSLDetails(
                                    SSLDetails.AuthType.ALLOW,
                                    SSLDetails.CACertificateType.NONE,
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
                    ds2.setWorkspaceId(sourceOrg1.getId());
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
                            true,
                            OAuth2.RefreshTokenClientCredentialsLocation.BODY,
                            "header prefix",
                            Set.of(
                                    new Property("custom token param 1", "custom token param value 1"),
                                    new Property("custom token param 2", "custom token param value 2")
                            ),
                            null,
                            null,
                            false
                    ));

                    final Datasource ds3 = new Datasource();
                    ds3.setName("datasource 3");
                    ds3.setWorkspaceId(sourceOrg1.getId());
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
                                action1.setWorkspaceId(sourceOrg1.getId());
                                action1.setDatasource(ds1WithId);
                                action1.setPluginId(installedPlugin.getId());

                                final ActionDTO action2 = new ActionDTO();
                                action2.setPageId(firstPage.getId());
                                action2.setName("action2");
                                action2.setWorkspaceId(sourceOrg1.getId());
                                action2.setDatasource(ds1WithId);
                                action2.setPluginId(installedPlugin.getId());

                                final ActionDTO action3 = new ActionDTO();
                                action3.setPageId(firstPage.getId());
                                action3.setName("action3");
                                action3.setWorkspaceId(sourceOrg1.getId());
                                action3.setDatasource(ds2WithId);
                                action3.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                        layoutActionService.createSingleAction(action1),
                                        layoutActionService.createSingleAction(action2),
                                        layoutActionService.createSingleAction(action3)
                                ).then(Mono.zip(
                                        workspaceService.create(targetOrg),
                                        Mono.just(app)
                                ));
                            })
                            .flatMap(tuple1 -> {
                                final Workspace targetOrg1 = tuple1.getT1();
                                final String originalId = tuple1.getT2().getId();
                                final String originalName = tuple1.getT2().getName();

                                Mono<Void> clonerMono = Mono.just(tuple1.getT2())
                                        .map(app -> {
                                            // We reset these values here because the clone method updates them and that just messes with our test.
                                            app.setId(originalId);
                                            app.setName(originalName);
                                            return app;
                                        })
                                        .flatMap(app -> examplesWorkspaceCloner.cloneApplications(
                                                targetOrg1.getId(),
                                                Flux.fromArray(new Application[]{app})
                                        ))
                                        .then();

                                return clonerMono
                                        .then(clonerMono)
                                        .then(clonerMono)
                                        .thenReturn(targetOrg1);
                            });
                })
                .flatMap(this::loadWorkspaceData)
                .doOnError(error -> log.error("Error in test", error));

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("Target Org 2");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

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

    private Flux<ActionDTO> getActionsInWorkspace(Workspace workspace) {
        return applicationService
                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> newActionService.getUnpublishedActionsExceptJs(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }

    private Flux<ActionCollectionDTO> getActionCollectionsInWorkspace(Workspace workspace) {
        return applicationService
                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> actionCollectionService.getPopulatedActionCollectionsByViewMode(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId()))), false));
    }
}
