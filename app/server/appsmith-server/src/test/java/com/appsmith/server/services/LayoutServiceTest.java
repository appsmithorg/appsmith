package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
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
    ApplicationService applicationService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    NewPageService newPageService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String orgId;

    Datasource datasource;

    Plugin installedJsPlugin;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        purgeAllPages();
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(orgId);
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
        Mono<Application> applicationMono = applicationPageService.createApplication(application, orgId);

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
                    assertThat(layout.getDsl().equals(obj));
                })
                .verifyComplete();
    }

    private Mono<PageDTO> createPage(Application app, PageDTO page) {
        return newPageService
                .findByNameAndViewMode(page.getName(), AclPermission.READ_PAGES, false)
                .switchIfEmpty(applicationPageService.createApplication(app, orgId)
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

        Mono<LayoutDTO> updatedLayoutMono = layoutActionService.updateLayout("random-impossible-id-page", startLayout.getId(), updateLayout);

        StepVerifier
                .create(updatedLayoutMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.ACL_NO_RESOURCE_FOUND
                                .getMessage(FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, "random-impossible-id-page" + ", " + startLayout.getId())))
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
                    return layoutActionService.updateLayout(page.getId(), startLayout.getId(), updateLayout);
                });

        StepVerifier
                .create(updatedLayoutMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getDsl().equals(obj1));
                })
                .verifyComplete();
    }

    /**
     * TODO: Comment no longer valid
     * This test adds some actions in the page and attaches a few of those in the dynamic bindings in the widgets
     * in the layout. An action attached in the widget also has two dependencies on other actions. One of those
     * has been explicitly marked to NOT run on page load. This test asserts the following :
     * 1. All the actions which must be executed on page load have been recognized correctly
     * 2. The sequence of the action execution takes into account the action dependencies
     * 3. An action which has been marked to not execute on page load does not get added to the on page load order
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoad() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Test Page");

        Application app = new Application();
        app.setName("newApplication-updateLayoutValidPageId-Test");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

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
                    monos.add(layoutActionService.createSingleAction(action));

                    // Create a POST API Action
                    action = new ActionDTO();
                    action.setName("aPostAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("aPostTertiaryAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("aDeleteAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.DELETE);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("aDBAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("anotherDBAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("aTableAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setPluginType(PluginType.DB);
                    monos.add(layoutActionService.createSingleAction(action));

                    Datasource d2 = new Datasource();
                    d2.setOrganizationId(datasource.getOrganizationId());
                    d2.setPluginId(installedJsPlugin.getId());
                    d2.setIsAutoGenerated(true);
                    d2.setName("UNUSED_DATASOURCE");

                    action = new ActionDTO();
                    action.setName("hiddenAction1");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("hiddenAction2");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("hiddenAction3");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

                    action = new ActionDTO();
                    action.setName("hiddenAction4");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                    monos.add(layoutActionService.createSingleAction(action));

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
                            "dynamicGet", "some dynamic {{aGetAction.data}}",
                            "dynamicPost", "some dynamic {{aPostAction.data}}",
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
                    obj.put("dynamicDB", new JSONObject(Map.of("test", "child path {{aDBAction.data.irrelevant}}")));
                    obj.put("dynamicDB2", List.of("{{ anotherDBAction.data.optional }}"));
                    obj.put("tableWidget", new JSONObject(
                            Map.of("test",
                                    List.of(
                                            Map.of("content",
                                                    Map.of("child", "{{aTableAction.data.child}}"))))));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "dynamicGet")),
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

                    return layoutActionService.updateLayout(page1.getId(), layout.getId(), newLayout);

                });
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
                            "hiddenAction4"
                    );

                    Set<String> secondSetPageLoadActions = Set.of(
                            "aTableAction",
                            "aDBAction",
                            "anotherDBAction"
                    );

                    Set<String> thirdSetPageLoadActions = Set.of(
                            "aPostActionWithAutoExec",
                            "Collection.anAsyncCollectionActionWithoutCall",
                            "Collection.aSyncCollectionActionWithoutCall"
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
                    .zipWith(newActionService.findByUnpublishedNameAndPageId("aPostAction", page.getId(), AclPermission.MANAGE_ACTIONS));
        });

        StepVerifier
                .create(actionDTOMono)
                .assertNext(tuple -> {
                    assertThat(tuple.getT1().getExecuteOnLoad()).isTrue();
                    assertThat(tuple.getT2().getExecuteOnLoad()).isNotEqualTo(Boolean.TRUE);
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
        String layoutId = page.getLayouts().get(0).getId();

        Mono<LayoutDTO> testMono = Mono.just(page)
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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
                            "another", "Hello people of the {{input1.text}} planet!",
                            "dynamicGet", "some dynamic {{aGetAction.data}}"
                    ));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.addAll(List.of(
                            new JSONObject(Map.of("key", "dynamicGet_IncorrectKey"))
                    ));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return layoutActionService.updateLayout(page1.getId(), layout.getId(), newLayout);
                });

        StepVerifier
                .create(testMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable instanceof AppsmithException);
                    assertThat(throwable.getMessage().equals(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE
                            .getMessage("test_type", "testWidget", "id", "dynamicGet_IncorrectKey", pageId, layoutId)));
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
        String pageId = page.getId();
        String layoutId = page.getLayouts().get(0).getId();

        Mono<LayoutDTO> testMono = Mono.just(page)
                .flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("aGetAction");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    monos.add(layoutActionService.createSingleAction(action));

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

                    return layoutActionService.updateLayout(page1.getId(), layout.getId(), newLayout);
                });

        StepVerifier
                .create(testMono)
                .assertNext(layoutDTO -> {
                    // We have reached here means we didnt get a throwable. Thats good
                    assertThat(layoutDTO).isNotNull();
                    // Since this is still a bad mustache binding, we couldn't have extracted the action name
                    assertThat(layoutDTO.getLayoutOnLoadActions().size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    @After
    public void purgePages() {
        newPageService.deleteAll();
    }
}
