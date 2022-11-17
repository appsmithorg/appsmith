package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Param;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.results.format.ResultFormatType;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import org.openjdk.jmh.runner.options.TimeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@SpringBootTest
public class UpdateLayoutBenchmark {
    private static NewPageService newPageService;
    private static UserService userService;
    private static WorkspaceService workspaceService;
    private static PluginRepository pluginRepository;
    private static ApplicationPageService applicationPageService;
    private static LayoutService layoutService;
    private static LayoutActionService layoutActionService;
    @MockBean
    private static PluginExecutorHelper pluginExecutorHelper;

    static String workspaceId;

    static Datasource datasource;

    static Plugin installedJsPlugin;

    PageDTO page;

    Layout layout;

    @Autowired
    public void injectService(NewPageService newPageService,
                              UserService userService,
                              WorkspaceService workspaceService,
                              PluginRepository pluginRepository,
                              ApplicationPageService applicationPageService,
                              LayoutService layoutService,
                              LayoutActionService layoutActionService) {
        UpdateLayoutBenchmark.newPageService = newPageService;
        UpdateLayoutBenchmark.userService = userService;
        UpdateLayoutBenchmark.workspaceService = workspaceService;
        UpdateLayoutBenchmark.pluginRepository = pluginRepository;
        UpdateLayoutBenchmark.applicationPageService = applicationPageService;
        UpdateLayoutBenchmark.layoutService = layoutService;
        UpdateLayoutBenchmark.layoutActionService = layoutActionService;
    }

    @State(Scope.Benchmark)
    public static class BenchmarkState {

        @Param({"basic", "general"})
        String type;
        JSONObject dsl;

        @Setup
        public void setup() {
            switch (type) {
                case "basic":
                    dsl = new JSONObject();
                    dsl.put("key1", "value-updated");
                    break;
                case "general":
                default:
                    dsl = new JSONObject(Map.of(
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
                    dsl.putAll(Map.of(
                            "collection1Key", "some dynamic {{Collection.anAsyncCollectionActionWithoutCall.data}}",
                            "collection2Key", "some dynamic {{Collection.aSyncCollectionActionWithoutCall.data}}",
                            "collection3Key", "some dynamic {{Collection.anAsyncCollectionActionWithCall()}}",
                            // only add sync function call dependencies in the dependency tree. sync call would be done during eval.
                            "collection4Key", "some dynamic {{Collection.aSyncCollectionActionWithCall()}}"
                    ));
                    dsl.put("dynamicDB", new JSONObject(Map.of("test", "child path {{aDBAction.data[0].irrelevant}}")));
                    dsl.put("dynamicDB2", List.of("{{ anotherDBAction.data.optional }}"));
                    dsl.put("tableWidget", new JSONObject(
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


                    dsl.put("dynamicBindingPathList", dynamicBindingsPathList);
            }
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void start() throws RunnerException {
        Options options = new OptionsBuilder()
                .warmupIterations(3)
                .warmupTime(TimeValue.seconds(20))
                .measurementIterations(3)
                .measurementTime(TimeValue.seconds(20))
                .forks(0)
                .threads(-1)
                .shouldDoGC(true)
                .shouldFailOnError(true)
                .resultFormat(ResultFormatType.JSON)
                .build();
        new Runner(options).run();
    }

    @Setup
    @WithUserDetails(value = "api_user")
    public void setup() {

        newPageService.deleteAll().block();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Update Layout Benchmark");

        Workspace workspace = workspaceService.create(toCreate, apiUser).block();
        workspaceId = workspace.getId();

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        datasource.setPluginId(installedPlugin.getId());

        Layout testLayout = new Layout();
        JSONObject obj = new JSONObject();
        obj.put("key", "value");
        testLayout.setDsl(obj);

        Layout updateLayout = new Layout();
        JSONObject obj1 = new JSONObject();
        obj1.put("key1", "value-updated");
        updateLayout.setDsl(obj);

        PageDTO testPage = new PageDTO();
        testPage.setName("Update Layout Base Benchmark");

        Application app = new Application();
        app.setName("newApplication-updateLayoutBenchmark-Base");

        this.page = createPage(app, testPage).block();

        assert this.page != null;

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Create a GET API Action
        ActionDTO action = new ActionDTO();
        action.setName("aGetAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        // Create a POST API Action
        action = new ActionDTO();
        action.setName("aPostAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        // Create another POST API Action
        action = new ActionDTO();
        action.setName("anotherPostAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        // Action aPostActionWithAutoExec depends on [aPostSecondaryAction, aPostTertiaryAction]
        action = new ActionDTO();
        action.setName("aPostActionWithAutoExec");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.getActionConfiguration().setBody(
                "this won't be auto-executed: {{aPostSecondaryAction.data}}, but this one will be: {{aPostTertiaryAction.data}}.");
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        action.setDynamicBindingPathList(List.of(new Property("body", null)));
        layoutActionService.createSingleAction(action).block();

        // User has set this action to NOT run on page load
        // This is an independent action with no dependencies
        action = new ActionDTO();
        action.setName("aPostSecondaryAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        action.setExecuteOnLoad(false);
        action.setUserSetOnLoad(true);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("aPostTertiaryAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("aDeleteAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.DELETE);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("aDBAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        action.setPluginType(PluginType.DB);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("anotherDBAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        action.setPluginType(PluginType.DB);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("aTableAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        action.setPluginType(PluginType.DB);
        layoutActionService.createSingleAction(action).block();

        Datasource d2 = new Datasource();
        d2.setWorkspaceId(datasource.getWorkspaceId());
        d2.setPluginId(installedJsPlugin.getId());
        d2.setIsAutoGenerated(true);
        d2.setName("UNUSED_DATASOURCE");

        action = new ActionDTO();
        action.setName("hiddenAction1");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("asyncCollectionAction1");
        action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithoutCall");
        final ActionConfiguration ac1 = new ActionConfiguration();
        ac1.setBody("hiddenAction1.data");
        ac1.setIsAsync(true);
        action.setActionConfiguration(ac1);
        action.setDatasource(d2);
        action.setPageId(page.getId());
        action.setPluginType(PluginType.JS);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("hiddenAction2");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("syncCollectionAction1");
        action.setFullyQualifiedName("Collection.aSyncCollectionActionWithoutCall");
        final ActionConfiguration ac2 = new ActionConfiguration();
        ac2.setBody("hiddenAction2.data");
        ac2.setIsAsync(false);
        action.setActionConfiguration(ac2);
        action.setDatasource(d2);
        action.setPageId(page.getId());
        action.setPluginType(PluginType.JS);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("hiddenAction3");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("asyncCollectionAction2");
        action.setFullyQualifiedName("Collection.anAsyncCollectionActionWithCall");
        action.setDynamicBindingPathList(List.of(new Property("body", null)));
        final ActionConfiguration ac3 = new ActionConfiguration();
        ac3.setBody("hiddenAction3.data");
        ac3.setIsAsync(true);
        action.setActionConfiguration(ac3);
        action.setDatasource(d2);
        action.setPageId(page.getId());
        action.setPluginType(PluginType.JS);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("hiddenAction4");
        action.setActionConfiguration(new ActionConfiguration());
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("syncCollectionAction2");
        action.setFullyQualifiedName("Collection.aSyncCollectionActionWithCall");
        final ActionConfiguration ac4 = new ActionConfiguration();
        ac4.setBody("hiddenAction4.data");
        ac4.setIsAsync(false);
        action.setActionConfiguration(ac4);
        action.setDatasource(d2);
        action.setPageId(page.getId());
        action.setPluginType(PluginType.JS);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("anIgnoredAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("ignoredAction1");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("ignoredAction2");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("ignoredAction3");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        action = new ActionDTO();
        action.setName("ignoredAction4");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setHttpMethod(HttpMethod.GET);
        action.setPageId(page.getId());
        action.setDatasource(datasource);
        layoutActionService.createSingleAction(action).block();

        this.layout = layoutService.createLayout(page.getId(), testLayout).block();
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

    @Benchmark
    public void updateLayoutBenchmark(BenchmarkState benchmarkState) {
        layout.setDsl(benchmarkState.dsl);
        StepVerifier.create(layoutActionService.updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout))
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                })
                .verifyComplete();
    }
}
