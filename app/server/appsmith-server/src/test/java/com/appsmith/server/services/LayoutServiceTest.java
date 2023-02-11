package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.server.services.ce.ApplicationPageServiceCEImpl.EVALUATION_VERSION;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class LayoutServiceTest {
    @Autowired
    LayoutService layoutService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    NewPageService newPageService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String workspaceId;

    Datasource datasource;

    Plugin installedJsPlugin;

    @SpyBean
    AstService astService;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("LayoutServiceTest");

        Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        datasource.setPluginId(installedPlugin.getId());
    }

    private void purgeAllPages() {
        newPageService.deleteAll();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createLayoutWithNullPageId() {
        Layout layout = new Layout();
        Mono<Layout> layoutMono = layoutService.createLayout(null, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createLayoutWithInvalidPageID() {
        Layout layout = new Layout();
        String pageId = "Some random ID which can never be a page's ID";
        Mono<Layout> layoutMono = layoutService.createLayout(pageId, layout);
        StepVerifier
                .create(layoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidLayout() {
        PageDTO testPage = new PageDTO();
        testPage.setName("createLayoutPageName");

        Application application = new Application();
        application.setName("createValidLayout-Test-Application");
        Mono<Application> applicationMono = applicationPageService.createApplication(application, workspaceId);

        Mono<PageDTO> pageMono = applicationMono
                .switchIfEmpty(Mono.error(new Exception("No application found")))
                .map(app -> {
                    testPage.setApplicationId(app.getId());
                    return testPage;
                })
                .flatMap(applicationPageService::createPage);

        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key1", "value1");
        testLayout.setDsl(obj);

        Mono<Layout> layoutMono = pageMono
                .flatMap(page -> layoutService.createLayout(page.getId(), testLayout));

        StepVerifier
                .create(layoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl()).isEqualTo(obj);
                })
                .verifyComplete();
    }

    private Mono<PageDTO> createPage(Application app, PageDTO page) {
        return newPageService
                .findByNameAndViewMode(page.getName(), AclPermission.READ_PAGES, false)
                .switchIfEmpty(applicationPageService.createApplication(app, workspaceId)
                        .map(application -> {
                            page.setApplicationId(application.getId());
                            return page;
                        })
                        .flatMap(applicationPageService::createPage));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayoutInvalidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        PageDTO testPage = new PageDTO();
        testPage.setName("LayoutServiceTest updateLayoutInvalidPageId");

        Layout updateLayout = new Layout();
        obj = new JSONObject();
        obj.put("key", "value-updated");
        updateLayout.setDsl(obj);

        Application app = new Application();
        app.setName("newApplication-updateLayoutInvalidPageId-Test");
        PageDTO page = createPage(app, testPage).block();

        Layout startLayout = layoutService.createLayout(page.getId(), testLayout).block();

        Mono<LayoutDTO> updatedLayoutMono = layoutActionService.updateLayout("random-impossible-id-page", page.getApplicationId(), startLayout.getId(), updateLayout);

        StepVerifier
                .create(updatedLayoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.ACL_NO_RESOURCE_FOUND
                                .getMessage(FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, "random-impossible-id-page" + ", " + startLayout.getId())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayoutInvalidAppId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        PageDTO testPage = new PageDTO();
        testPage.setName("LayoutServiceTest updateLayoutInvalidPageId");

        Layout updateLayout = new Layout();
        obj = new JSONObject();
        obj.put("key", "value-updated");
        updateLayout.setDsl(obj);

        Application app = new Application();
        app.setName("newApplication-updateLayoutInvalidPageId-Test");
        PageDTO page = createPage(app, testPage).block();

        Layout startLayout = layoutService.createLayout(page.getId(), testLayout).block();

        Mono<LayoutDTO> updatedLayoutMono = layoutActionService.updateLayout(page.getId(), "random-impossible-id-app", startLayout.getId(), updateLayout);

        StepVerifier
                .create(updatedLayoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.ACL_NO_RESOURCE_FOUND
                                .getMessage(FieldName.APPLICATION_ID, "random-impossible-id-app")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayoutValidPageId() {
        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        Layout updateLayout = new Layout();
        JSONObject obj1 = new JSONObject();
        obj1.put("key1", "value-updated");
        updateLayout.setDsl(obj);

        PageDTO testPage = new PageDTO();
        testPage.setName("LayoutServiceTest updateLayoutValidPageId");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-TestApplication");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<Layout> startLayoutMono = pageMono.flatMap(page -> layoutService.createLayout(page.getId(), testLayout));

        Mono<LayoutDTO> updatedLayoutMono = Mono.zip(pageMono, startLayoutMono)
                .flatMap(tuple -> {
                    PageDTO page = tuple.getT1();
                    Layout startLayout = tuple.getT2();
                    startLayout.setDsl(obj1);
                    return layoutActionService.updateLayout(page.getId(), page.getApplicationId(), startLayout.getId(), startLayout);
                });

        StepVerifier
                .create(updatedLayoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl()).isEqualTo(obj1);
                })
                .verifyComplete();
    }

    private Mono<LayoutDTO> createComplexAppForExecuteOnLoad(Mono<PageDTO> pageMono) {

        Mono<LayoutDTO> testMono = pageMono
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    // Create a GET API Action
                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a POST API Action
                    action = new ActionDTO();
                    action.setName("aPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create another POST API Action
                    action = new ActionDTO();
                    action.setName("anotherPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Action aPostActionWithAutoExec depends on [aPostSecondaryAction, aPostTertiaryAction]
                    action = new ActionDTO();
                    action.setName("aPostActionWithAutoExec");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.getActionConfiguration().setBody(
                            "this won't be auto-executed: {{aPostSecondaryAction.data}}, but this one will be: {{aPostTertiaryAction.data}}.");
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setDynamicBindingPathList(List.of(new Property("body", null)));
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // User has set this action to NOT run on page load
                    // This is an independent action with no dependencies
                    action = new ActionDTO();
                    action.setName("aPostSecondaryAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setExecuteOnLoad(false);
                    action.setUserSetOnLoad(true);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("aPostTertiaryAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("aDeleteAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.DELETE);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("aDBAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("anotherDBAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("aTableAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    Datasource d2 = new Datasource();
                    d2.setWorkspaceId(datasource.getWorkspaceId());
                    d2.setPluginId(installedJsPlugin.getId());
                    d2.setIsAutoGenerated(true);
                    d2.setName("UNUSED_DATASOURCE");

                    action = new ActionDTO();
                    action.setName("hiddenAction1");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("asyncCollectionAction1");
                    action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithoutCall");
                    final ActionConfiguration ac1 = new ActionConfiguration();
                    ac1.setBody("hiddenAction1.data");
                    ac1.setIsAsync(true);
                    action.setActionConfiguration(ac1);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction2");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("syncCollectionAction1");
                    action.setFullyQualifiedName("Collection.aSyncCollectionActionWithoutCall");
                    final ActionConfiguration ac2 = new ActionConfiguration();
                    ac2.setBody("hiddenAction2.data");
                    ac2.setIsAsync(false);
                    action.setActionConfiguration(ac2);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction3");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("asyncCollectionAction2");
                    action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithCall");
                    action.setDynamicBindingPathList(List.of(new Property("body", null)));
                    final ActionConfiguration ac3 = new ActionConfiguration();
                    ac3.setBody("hiddenAction3.data");
                    ac3.setIsAsync(true);
                    action.setActionConfiguration(ac3);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction4");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("syncCollectionAction2");
                    action.setFullyQualifiedName("Collection.aSyncCollectionActionWithCall");
                    final ActionConfiguration ac4 = new ActionConfiguration();
                    ac4.setBody("hiddenAction4.data");
                    ac4.setIsAsync(false);
                    action.setActionConfiguration(ac4);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("anIgnoredAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("ignoredAction1");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("ignoredAction2");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("ignoredAction3");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("ignoredAction4");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final PageDTO page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "key", "value-updated",
                            "another", "Hello people of the {{input1.text}} planet!",
                            "dynamicGet", "some dynamic {{\"anIgnoredAction.data:\" + aGetAction.data}}",
                            "dynamicPost", "some dynamic {{\n" +
                                    "(function(ignoredAction1){\n" +
                                    "\tlet a = ignoredAction1.data\n" +
                                    "\tlet ignoredAction2 = { data: \"nothing\" }\n" +
                                    "\tlet b = ignoredAction2.data\n" +
                                    "\tlet c = \"ignoredAction3.data\"\n" +
                                    "\t// ignoredAction4.data\n" +
                                    "\treturn aPostAction.data\n" +
                                    "})(anotherPostAction.data)}}",
                            "dynamicPostWithAutoExec", "some dynamic {{aPostActionWithAutoExec.data}}",
                            "dynamicDelete", "some dynamic {{aDeleteAction.data}}"
                    ));
                    obj.putAll(Map.of(
                            "collection1Key", "some dynamic {{Collection.anAsyncCollectionActionWithoutCall.data}}",
                            "collection2Key", "some dynamic {{Collection.aSyncCollectionActionWithoutCall.data}}",
                            "collection3Key", "some dynamic {{Collection.anAsyncCollectionActionWithCall()}}",
                            // only add sync function call dependencies in the dependency tree. sync call would be done during eval.
                            "collection4Key", "some dynamic {{Collection.aSyncCollectionActionWithCall()}}"
                    ));
                    obj.put("dynamicDB", new JSONObject(Map.of("test", "child path {{aDBAction.data[0].irrelevant}}")));
                    obj.put("dynamicDB2", List.of("{{ anotherDBAction.data.optional }}"));
                    obj.put("tableWidget", new JSONObject(
                            Map.of("test",
                                    List.of(
                                            Map.of("content",
                                                    Map.of("child", "{{aTableAction.data.child}}"))))));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "dynamicGet")),
                            new JSONObject(Map.of("key", "dynamicPost")),
                            new JSONObject(Map.of("key", "dynamicPostWithAutoExec")),
                            new JSONObject(Map.of("key", "dynamicDB.test")),
                            new JSONObject(Map.of("key", "dynamicDB2.0")),
                            new JSONObject(Map.of("key", "tableWidget.test[0].content.child")),
                            new JSONObject(Map.of("key", "collection1Key")),
                            new JSONObject(Map.of("key", "collection2Key")),
                            new JSONObject(Map.of("key", "collection3Key")),
                            new JSONObject(Map.of("key", "collection4Key"))
                    ));


                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), page1.getApplicationId(), layout.getId(), newLayout);

                });

        return testMono;
    }

    private Mono<LayoutDTO> createAppWithAllTypesOfReferencesForExecuteOnLoad(Mono<PageDTO> pageMono) {

        Mono<LayoutDTO> testMono = pageMono
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    // Create a GET API Action for : aGetAction.data
                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a POST API Action for : aPostAction.data.users.name
                    action = new ActionDTO();
                    action.setName("aPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a POST API Action for : anotherPostAction.run()
                    action = new ActionDTO();
                    action.setName("anotherPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    Datasource d2 = new Datasource();
                    d2.setWorkspaceId(datasource.getWorkspaceId());
                    d2.setPluginId(installedJsPlugin.getId());
                    d2.setIsAutoGenerated(true);
                    d2.setName("UNUSED_DATASOURCE");

                    action = new ActionDTO();
                    action.setName("hiddenAction1");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create an async function for: Collection.anAsyncCollectionActionWithoutCall.data
                    action = new ActionDTO();
                    action.setName("anAsyncCollectionActionWithoutCall");
                    action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithoutCall");
                    action.setDynamicBindingPathList(List.of(new Property("body", null)));
                    final ActionConfiguration ac1 = new ActionConfiguration();
                    ac1.setBody("hiddenAction1.data");
                    ac1.setIsAsync(true);
                    action.setActionConfiguration(ac1);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction2");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a sync function for: Collection.aSyncCollectionActionWithoutCall.data
                    action = new ActionDTO();
                    action.setName("aSyncCollectionActionWithoutCall");
                    action.setFullyQualifiedName("Collection.aSyncCollectionActionWithoutCall");
                    action.setDynamicBindingPathList(List.of(new Property("body", null)));
                    final ActionConfiguration ac2 = new ActionConfiguration();
                    ac2.setBody("hiddenAction2.data");
                    ac2.setIsAsync(false);
                    action.setActionConfiguration(ac2);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction3");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create an async function for: Collection.anAsyncCollectionActionWithCall()
                    action = new ActionDTO();
                    action.setName("anAsyncCollectionActionWithCall");
                    action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithCall");
                    action.setDynamicBindingPathList(List.of(new Property("body", null)));
                    final ActionConfiguration ac3 = new ActionConfiguration();
                    ac3.setBody("hiddenAction3.data");
                    ac3.setIsAsync(true);
                    action.setActionConfiguration(ac3);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction4");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a sync function for: Collection.aSyncCollectionActionWithCall()
                    action = new ActionDTO();
                    action.setName("aSyncCollectionActionWithCall");
                    action.setFullyQualifiedName("Collection.aSyncCollectionActionWithCall");
                    final ActionConfiguration ac4 = new ActionConfiguration();
                    ac4.setBody("hiddenAction4.data");
                    ac4.setIsAsync(false);
                    action.setActionConfiguration(ac4);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction5");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create a sync function for: Collection.data()
                    action = new ActionDTO();
                    action.setName("data");
                    action.setFullyQualifiedName("Collection.data");
                    final ActionConfiguration ac5 = new ActionConfiguration();
                    ac5.setBody("hiddenAction5.data");
                    ac5.setIsAsync(false);
                    action.setActionConfiguration(ac5);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    action = new ActionDTO();
                    action.setName("hiddenAction6");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    // Create an async function for: Collection2.data()
                    action = new ActionDTO();
                    action.setName("data");
                    action.setFullyQualifiedName("Collection2.data");
                    final ActionConfiguration ac6 = new ActionConfiguration();
                    ac6.setBody("hiddenAction6.data");
                    ac6.setIsAsync(true);
                    action.setActionConfiguration(ac6);
                    action.setDatasource(d2);
                    action.setPageId(page1.getId());
                    action.setPluginType(PluginType.JS);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final PageDTO page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "k1", "{{ aGetAction.data }}",
                            "k2", "{{ aPostAction.data.users.name }}",
                            "k3", "{{ anotherPostAction.run() }}",
                            "k4", "{{ Collection.anAsyncCollectionActionWithoutCall.data }}",
                            "k5", "{{ Collection.aSyncCollectionActionWithoutCall.data }}",
                            "k6", "{{ Collection.anAsyncCollectionActionWithCall() }}",
                            "k7", "{{ Collection.aSyncCollectionActionWithCall() }}"
                    ));
                    obj.putAll(Map.of(
                            "k8", "{{ Collection.data() }}",
                            "k9", "{{ Collection2.data() }}"
                    ));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "k1")),
                            new JSONObject(Map.of("key", "k2")),
                            new JSONObject(Map.of("key", "k3")),
                            new JSONObject(Map.of("key", "k4")),
                            new JSONObject(Map.of("key", "k5")),
                            new JSONObject(Map.of("key", "k6")),
                            new JSONObject(Map.of("key", "k7")),
                            new JSONObject(Map.of("key", "k8")),
                            new JSONObject(Map.of("key", "k9"))
                    ));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), page1.getApplicationId(), layout.getId(), newLayout);

                });

        return testMono;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoadWithAstLogic_withAllTypesOfActionReferences() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Test Page1 Universal");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-TestWithAst-Universal");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<LayoutDTO> testMono = createAppWithAllTypesOfReferencesForExecuteOnLoad(pageMono);


        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aGetAction.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aGetAction.data", new HashSet<>(Set.of("aGetAction.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aPostAction.data.users.name"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aPostAction.data.users.name", new HashSet<>(Set.of("aPostAction.data.users.name")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("anotherPostAction.run()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("anotherPostAction.run()", new HashSet<>(Set.of("anotherPostAction.run")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.anAsyncCollectionActionWithoutCall.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.anAsyncCollectionActionWithoutCall.data", new HashSet<>(Set.of("Collection.anAsyncCollectionActionWithoutCall.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.aSyncCollectionActionWithoutCall.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.aSyncCollectionActionWithoutCall.data", new HashSet<>(Set.of("Collection.aSyncCollectionActionWithoutCall.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.anAsyncCollectionActionWithCall()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.anAsyncCollectionActionWithCall()", new HashSet<>(Set.of("Collection.anAsyncCollectionActionWithCall")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.aSyncCollectionActionWithCall()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.aSyncCollectionActionWithCall()", new HashSet<>(Set.of("Collection.aSyncCollectionActionWithCall")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.data()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.data()", new HashSet<>(Set.of("Collection.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection2.data()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection2.data()", new HashSet<>(Set.of("Collection2.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction1.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction1.data", new HashSet<>(Set.of("hiddenAction1.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction2.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction2.data", new HashSet<>(Set.of("hiddenAction2.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction4.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction4.data", new HashSet<>(Set.of("hiddenAction4.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction5.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction5.data", new HashSet<>(Set.of("hiddenAction5.data")))));

        StepVerifier
                .create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(3);

                    Set<String> firstSetPageLoadActions = Set.of(
                            "aGetAction",
                            "hiddenAction1",
                            "hiddenAction2",
                            "hiddenAction4",
                            "hiddenAction5"
                    );

                    Set<String> secondSetPageLoadActions = Set.of(
                            "aPostAction"
                    );

                    Set<String> thirdSetPageLoadActions = Set.of(
                            "Collection.anAsyncCollectionActionWithoutCall"
                    );

                    assertThat(layout.getLayoutOnLoadActions().get(0).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(firstSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(1).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(secondSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(2).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(thirdSetPageLoadActions);
                    Set<DslActionDTO> flatOnLoadActions = new HashSet<>();
                    for (Set<DslActionDTO> actions : layout.getLayoutOnLoadActions()) {
                        flatOnLoadActions.addAll(actions);
                    }
                    for (DslActionDTO action : flatOnLoadActions) {
                        assertThat(action.getId()).isNotBlank();
                        assertThat(action.getName()).isNotBlank();
                        assertThat(action.getTimeoutInMillisecond()).isNotZero();
                    }
                })
                .verifyComplete();

        Mono<Tuple2<ActionDTO, ActionDTO>> actionDTOMono = pageMono.flatMap(page -> {
            return newActionService.findByUnpublishedNameAndPageId("aGetAction", page.getId(), AclPermission.MANAGE_ACTIONS)
                    .zipWith(newActionService.findByUnpublishedNameAndPageId("hiddenAction3", page.getId(), AclPermission.MANAGE_ACTIONS));
        });

        StepVerifier
                .create(actionDTOMono)
                .assertNext(tuple -> {
                    assertThat(tuple.getT1().getExecuteOnLoad()).isTrue();
                    assertThat(tuple.getT2().getExecuteOnLoad()).isNotEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    /**
     * This test is meant for the newer AST based on page load logic that is meant to work with fat container deployments.
     * This test adds some actions in the page and attaches a few of those in the dynamic bindings in the widgets
     * in the layout. An action attached in the widget also has two dependencies on other actions. One of those
     * has been explicitly marked to NOT run on page load. This test asserts the following :
     * 1. All the actions which must be executed on page load have been recognized correctly
     * 2. The sequence of the action execution takes into account the action dependencies
     * 3. An action which has been marked to not execute on page load does not get added to the on page load order
     * 4. Async and sync JS functions when called with a .data reference are marked to run on load
     * 5. Async and sync JS function when called as function calls are ignored to be marked on page load
     * 6. A string that happens to match an action reference IS NOT marked to run on page load
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoadWithAstLogic() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));


        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Test Page1");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-TestWithAst");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<LayoutDTO> testMono = createComplexAppForExecuteOnLoad(pageMono);


        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("\"anIgnoredAction.data:\" + aGetAction.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("\"anIgnoredAction.data:\" + aGetAction.data", new HashSet<>(Set.of("aGetAction.data")))));
        String bindingValue = "\n(function(ignoredAction1){\n" +
                "\tlet a = ignoredAction1.data\n" +
                "\tlet ignoredAction2 = { data: \"nothing\" }\n" +
                "\tlet b = ignoredAction2.data\n" +
                "\tlet c = \"ignoredAction3.data\"\n" +
                "\t// ignoredAction4.data\n" +
                "\treturn aPostAction.data\n" +
                "})(anotherPostAction.data)";
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(
                        List.of(bindingValue), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of(bindingValue, new HashSet<>(Set.of("aPostAction.data", "anotherPostAction.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aPostActionWithAutoExec.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aPostActionWithAutoExec.data", new HashSet<>(Set.of("aPostActionWithAutoExec.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aDBAction.data[0].irrelevant"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aDBAction.data[0].irrelevant", new HashSet<>(Set.of("aDBAction.data[0].irrelevant")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of(" anotherDBAction.data.optional "), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of(" anotherDBAction.data.optional ", new HashSet<>(Set.of("anotherDBAction.data.optional")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aTableAction.data.child"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aTableAction.data.child", new HashSet<>(Set.of("aTableAction.data.child")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.anAsyncCollectionActionWithoutCall.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.anAsyncCollectionActionWithoutCall.data", new HashSet<>(Set.of("Collection.anAsyncCollectionActionWithoutCall.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.aSyncCollectionActionWithoutCall.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.aSyncCollectionActionWithoutCall.data", new HashSet<>(Set.of("Collection.aSyncCollectionActionWithoutCall.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.anAsyncCollectionActionWithCall()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.anAsyncCollectionActionWithCall()", new HashSet<>(Set.of("Collection.anAsyncCollectionActionWithCall")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("Collection.aSyncCollectionActionWithCall()"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("Collection.aSyncCollectionActionWithCall()", new HashSet<>(Set.of("Collection.aSyncCollectionActionWithCall")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction4.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction4.data", new HashSet<>(Set.of("hiddenAction4.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction2.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction2.data", new HashSet<>(Set.of("hiddenAction2.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("hiddenAction1.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("hiddenAction1.data", new HashSet<>(Set.of("hiddenAction1.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aPostTertiaryAction.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aPostTertiaryAction.data", new HashSet<>(Set.of("aPostTertiaryAction.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(List.of("aPostSecondaryAction.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("aPostSecondaryAction.data", new HashSet<>(Set.of("aPostSecondaryAction.data")))));
        StepVerifier
                .create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().get("key")).isEqualTo("value-updated");
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(4);

                    Set<String> firstSetPageLoadActions = Set.of(
                            "aPostTertiaryAction",
                            "aGetAction",
                            "hiddenAction1",
                            "hiddenAction2",
                            "hiddenAction4",
                            "aPostAction",
                            "anotherPostAction"
                    );

                    Set<String> secondSetPageLoadActions = Set.of(
                            "aTableAction",
                            "anotherDBAction"
                    );

                    Set<String> thirdSetPageLoadActions = Set.of(
                            "aDBAction"
                    );

                    Set<String> fourthSetPageLoadActions = Set.of(
                            "aPostActionWithAutoExec",
                            "Collection.anAsyncCollectionActionWithoutCall"
                    );
                    assertThat(layout.getLayoutOnLoadActions().get(0).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(firstSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(1).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(secondSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(2).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(thirdSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(3).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(fourthSetPageLoadActions);
                    Set<DslActionDTO> flatOnLoadActions = new HashSet<>();
                    for (Set<DslActionDTO> actions : layout.getLayoutOnLoadActions()) {
                        flatOnLoadActions.addAll(actions);
                    }
                    for (DslActionDTO action : flatOnLoadActions) {
                        assertThat(action.getId()).isNotBlank();
                        assertThat(action.getName()).isNotBlank();
                        assertThat(action.getTimeoutInMillisecond()).isNotZero();
                    }
                })
                .verifyComplete();

        Mono<Tuple2<ActionDTO, ActionDTO>> actionDTOMono = pageMono.flatMap(page -> {
            return newActionService.findByUnpublishedNameAndPageId("aGetAction", page.getId(), AclPermission.MANAGE_ACTIONS)
                    .zipWith(newActionService.findByUnpublishedNameAndPageId("ignoredAction1", page.getId(), AclPermission.MANAGE_ACTIONS));
        });

        StepVerifier
                .create(actionDTOMono)
                .assertNext(tuple -> {
                    assertThat(tuple.getT1().getExecuteOnLoad()).isTrue();
                    assertThat(tuple.getT2().getExecuteOnLoad()).isNotEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }


    /**
     * This test is meant for the older string based on page load logic that persists today for older deployments.
     * The expectation is the same as the previous test, except that only valid global references are marked to run on page load.
     * (Please refer point #6 in this list)
     * This test adds some actions in the page and attaches a few of those in the dynamic bindings in the widgets
     * in the layout. An action attached in the widget also has two dependencies on other actions. One of those
     * has been explicitly marked to NOT run on page load. This test asserts the following :
     * 1. All the actions which must be executed on page load have been recognized correctly
     * 2. The sequence of the action execution takes into account the action dependencies
     * 3. An action which has been marked to not execute on page load does not get added to the on page load order
     * 4. Async and sync JS functions when called with a .data reference are marked to run on load
     * 5. Async and sync JS function when called as function calls are ignored to be marked on page load
     * 6. A string that happens to match an action reference DOES GET INCORRECTLY marked to run on page load
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoadWithoutAstLogic() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(Mockito.anyList(), Mockito.anyInt())).thenCallRealMethod();

        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Test Page2");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-TestWithoutAst");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<LayoutDTO> testMono = createComplexAppForExecuteOnLoad(pageMono);

        StepVerifier
                .create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().get("key")).isEqualTo("value-updated");
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(3);

                    Set<String> firstSetPageLoadActions = Set.of(
                            "aPostTertiaryAction",
                            "aGetAction",
                            "hiddenAction1",
                            "hiddenAction2",
                            "hiddenAction4",
                            "anIgnoredAction",
                            "aDBAction",
                            "aPostAction",
                            "anotherPostAction",
                            "ignoredAction1",
                            "ignoredAction2",
                            "ignoredAction3",
                            "ignoredAction4"
                    );

                    Set<String> secondSetPageLoadActions = Set.of(
                            "aTableAction",
                            "anotherDBAction"
                    );

                    Set<String> thirdSetPageLoadActions = Set.of(
                            "aPostActionWithAutoExec",
                            "Collection.anAsyncCollectionActionWithoutCall"
                    );
                    assertThat(layout.getLayoutOnLoadActions().get(0).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(firstSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(1).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(secondSetPageLoadActions);
                    assertThat(layout.getLayoutOnLoadActions().get(2).stream().map(DslActionDTO::getName).collect(Collectors.toSet()))
                            .hasSameElementsAs(thirdSetPageLoadActions);
                    Set<DslActionDTO> flatOnLoadActions = new HashSet<>();
                    for (Set<DslActionDTO> actions : layout.getLayoutOnLoadActions()) {
                        flatOnLoadActions.addAll(actions);
                    }
                    for (DslActionDTO action : flatOnLoadActions) {
                        assertThat(action.getId()).isNotBlank();
                        assertThat(action.getName()).isNotBlank();
                        assertThat(action.getTimeoutInMillisecond()).isNotZero();
                    }
                })
                .verifyComplete();

        Mono<Tuple2<ActionDTO, ActionDTO>> actionDTOMono = pageMono.flatMap(page -> {
            return newActionService.findByUnpublishedNameAndPageId("aGetAction", page.getId(), AclPermission.MANAGE_ACTIONS)
                    .zipWith(newActionService.findByUnpublishedNameAndPageId("ignoredAction1", page.getId(), AclPermission.MANAGE_ACTIONS));
        });

        StepVerifier
                .create(actionDTOMono)
                .assertNext(tuple -> {
                    assertThat(tuple.getT1().getExecuteOnLoad()).isTrue();
                    assertThat(tuple.getT2().getExecuteOnLoad()).isTrue();
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void testIncorrectDynamicBindingPathInDsl() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("testIncorrectDynamicBinding Test Page");

        Application app = new Application();
        app.setName("newApplication-testIncorrectDynamicBinding-Test");

        PageDTO page = createPage(app, testPage).block();
        String pageId = page.getId();
        final AtomicReference<String> layoutId = new AtomicReference<>();

        Mono<LayoutDTO> testMono = Mono.just(page)
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final PageDTO page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();
                    layoutId.set(layout.getId());

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "widgetId", "id",
                            "type", "test_type",
                            "key", "value-updated",
                            "another", "Hello people of the {{input1.text}} planet!",
                            "dynamicGet", "some dynamic {{aGetAction.data}}"
                    ));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "dynamicGet_IncorrectKey"))
                    ));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), page1.getApplicationId(), layout.getId(), newLayout);
                });

        StepVerifier
                .create(testMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    ObjectMapper objectMapper = new ObjectMapper();
                    Object oldParent = null;
                    try {
                        oldParent = objectMapper.readTree("{\"widgetName\":\"testWidget\",\"dynamicBindingPathList\":[{\"key\":\"dynamicGet_IncorrectKey\"}],\"widgetId\":\"id\",\"another\":\"Hello people of the {{input1.text}} planet!\",\"dynamicGet\":\"some dynamic {{aGetAction.data}}\",\"type\":\"test_type\",\"key\":\"value-updated\"}");
                    } catch (JsonProcessingException e) {
                        Assertions.fail("Incorrect initialization of expected DSL");
                    }
                    assertThat(throwable.getMessage()).isEqualTo(
                            AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE.getMessage("test_type", "testWidget", "id", "dynamicGet_IncorrectKey", pageId, layoutId.get(), oldParent,  "dynamicGet_IncorrectKey", "New element is null")
                    );
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testIncorrectMustacheExpressionInBindingInDsl() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("testIncorrectMustacheExpressionInBinding Test Page");

        Application app = new Application();
        app.setName("newApplication-testIncorrectMustacheExpressionInBinding-Test");

        PageDTO page = createPage(app, testPage).block();

        Mono<LayoutDTO> testMono = Mono.just(page)
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    return Mono.zip(monos, objects -> page1);
                })
                .zipWhen(page1 -> {
                    Layout layout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "key", "value"
                    ));
                    layout.setDsl(obj);

                    return layoutService.createLayout(page1.getId(), layout);
                })
                .flatMap(tuple2 -> {
                    final PageDTO page1 = tuple2.getT1();
                    final Layout layout = tuple2.getT2();

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "widgetId", "id",
                            "type", "test_type",
                            "key", "value-updated",
                            "dynamicGet", "a\"{{aGetAction\"/'\"'}}\"\""
                    ));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "dynamicGet"))
                    ));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), page1.getApplicationId(), layout.getId(), newLayout);
                });

        StepVerifier
                .create(testMono)
                .assertNext(layoutDTO -> {
                    // We have reached here means we didn't get a throwable. That's good
                    assertThat(layoutDTO).isNotNull();
                    // Since this is still a bad mustache binding, we couldn't have extracted the action name
                    assertThat(layoutDTO.getLayoutOnLoadActions().size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @AfterEach
    public void purgePages() {
        newPageService.deleteAll();
    }
}
