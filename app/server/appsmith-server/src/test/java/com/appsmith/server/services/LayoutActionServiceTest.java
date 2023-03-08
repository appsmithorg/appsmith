package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.ce.UpdateMultiplePageLayoutDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.RefactoringSolution;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static com.mongodb.assertions.Assertions.assertNull;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class LayoutActionServiceTest {
    @SpyBean
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    RefactoringSolution refactoringSolution;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @SpyBean
    NewPageService newPageService;

    @Autowired
    NewActionRepository actionRepository;

    @SpyBean
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String branchName;

    Datasource jsDatasource;

    ObjectMapper objectMapper = new ObjectMapper();

    Plugin installed_plugin;

    Plugin installedJsPlugin;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        newPageService.deleteAll();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("LayoutActionServiceTest");

        Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, workspace.getId()).block();

            final String pageId = testApp.getPages().get(0).getId();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

            Layout layout = testPage.getLayouts().get(0);
            JSONObject dsl = new JSONObject();
            dsl.put("widgetName", "firstWidget");
            JSONArray temp = new JSONArray();
            temp.addAll(List.of(new JSONObject(Map.of("key", "testField")),
                    new JSONObject(Map.of("key", "testField2"))));
            dsl.put("dynamicBindingPathList", temp);
            dsl.put("testField", "{{ query1.data }}");
            dsl.put("testField2", "{{jsObject.jsFunction.data}}");

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
            layoutActionService.updateLayout(pageId, testApp.getId(), layout.getId(), layout).block();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }

        if (gitConnectedApp == null) {
            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("actionServiceTest");
            newApp.setGitApplicationMetadata(gitData);
            gitConnectedApp = applicationPageService.createApplication(newApp, workspaceId)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application)
                                .zipWhen(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), gitData.getBranchName()));
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(tuple -> importExportApplicationService.importApplicationInWorkspace(workspaceId, tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                    .block();

            gitConnectedPage = newPageService.findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false).block();

            branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        }

        workspaceId = workspace.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS Database");
        jsDatasource.setWorkspaceId(workspaceId);
        installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());
    }

    @AfterEach
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        applicationPageService.deleteApplication(testApp.getId()).block();
        testApp = null;
        testPage = null;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUnpublishedAction_WhenActionDeleted_OnPageLoadActionsIsEmpty() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("query1");
        action.setFullyQualifiedName(action.getName());
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<PageDTO> resultMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();

                    // Configure action to execute on page load.
                    updates.setExecuteOnLoad(true);

                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);

                    // Save updated configuration and re-compute on page load actions.
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                })
                .flatMap(savedAction -> layoutActionService.deleteUnpublishedAction(savedAction.getId())) // Delete action
                .flatMap(savedAction -> newPageService.findPageById(testPage.getId(), READ_PAGES, false)); // Get page info

        StepVerifier
                .create(resultMono)
                .assertNext(page -> {
                    assertThat(page.getLayouts()).hasSize(1);

                    // Verify that no action is marked to run on page load.
                    assertThat(page.getLayouts().get(0).getLayoutOnLoadActions()).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateActionUpdatesLayout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("query1");
        action.setFullyQualifiedName(action.getName());
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO unreferencedAction = new ActionDTO();
        unreferencedAction.setName("query2");
        unreferencedAction.setFullyQualifiedName(unreferencedAction.getName());
        unreferencedAction.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        unreferencedAction.setActionConfiguration(actionConfiguration2);
        unreferencedAction.setDatasource(datasource);

        ActionDTO action3 = new ActionDTO();
        action3.setName("jsAction");
        action3.setPluginType(PluginType.JS);
        action3.setFullyQualifiedName("jsObject.jsFunction");
        action3.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setIsValid(false);
        action3.setActionConfiguration(actionConfiguration3);
        Datasource d2 = new Datasource();
        d2.setWorkspaceId(datasource.getWorkspaceId());
        d2.setPluginId(datasource.getPluginId());
        d2.setIsAutoGenerated(true);
        d2.setName("UNUSED_DATASOURCE");
        action3.setDatasource(d2);

        Mono<PageDTO> resultMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                })
                .flatMap(savedAction -> layoutActionService.createSingleAction(unreferencedAction, Boolean.FALSE))
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                })
                .flatMap(savedAction -> layoutActionService.createSingleAction(action3, Boolean.FALSE))
                .flatMap(savedAction -> {
                    assertFalse(savedAction.getActionConfiguration().getIsValid());
                    assertTrue(savedAction.getInvalids().contains(AppsmithError.INVALID_JS_ACTION.getMessage()));
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(d2);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                })
                // fetch the unpublished page
                .flatMap(savedAction -> newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(resultMono)
                .assertNext(page -> {
                    assertThat(page.getLayouts()).hasSize(1);
                    assertThat(page.getLayouts().get(0).getLayoutOnLoadActions()).hasSize(2);
                    Set<DslActionDTO> dslActionDTOS1 = page.getLayouts().get(0).getLayoutOnLoadActions().get(0);
                    assertThat(dslActionDTOS1).hasSize(1);
                    assertThat(dslActionDTOS1.stream().map(dto -> dto.getName()).collect(Collectors.toSet())).containsAll(Set.of("jsObject.jsFunction"));
                    Set<DslActionDTO> dslActionDTOS2 = page.getLayouts().get(0).getLayoutOnLoadActions().get(1);
                    assertThat(dslActionDTOS2).hasSize(1);
                    assertThat(dslActionDTOS2.stream().map(dto -> dto.getName()).collect(Collectors.toSet())).containsAll(Set.of("query1"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayout_WhenOnLoadChanged_ActionExecuted() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        action2.setActionConfiguration(actionConfiguration2);
        action2.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ firstAction.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    DslActionDTO actionDTO = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("firstAction");

                    List<LayoutActionUpdateDTO> actionUpdates = updatedLayout.getActionUpdates();
                    assertThat(actionUpdates.size()).isEqualTo(1);
                    assertThat(actionUpdates.get(0).getName()).isEqualTo("firstAction");
                    assertThat(actionUpdates.get(0).getExecuteOnLoad()).isTrue();
                })
                .verifyComplete();

        StepVerifier.create(newActionService.findById(createdAction1.getId()))
                .assertNext(newAction -> assertThat(newAction.getUnpublishedAction().getExecuteOnLoad()).isTrue());

        StepVerifier.create(newActionService.findById(createdAction2.getId()))
                .assertNext(newAction -> assertThat(newAction.getUnpublishedAction().getExecuteOnLoad()).isFalse());

        dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ secondAction.data }}");

        layout.setDsl(dsl);

        updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    log.debug("{}", updatedLayout.getMessages());
                    DslActionDTO actionDTO = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("secondAction");

                    List<LayoutActionUpdateDTO> actionUpdates = updatedLayout.getActionUpdates();
                    assertThat(actionUpdates.size()).isEqualTo(2);

                    Optional<LayoutActionUpdateDTO> firstActionUpdateOptional = actionUpdates.stream().filter(actionUpdate -> actionUpdate.getName().equals("firstAction")).findFirst();
                    LayoutActionUpdateDTO firstActionUpdate = firstActionUpdateOptional.get();
                    assertThat(firstActionUpdate).isNotNull();
                    assertThat(firstActionUpdate.getExecuteOnLoad()).isFalse();

                    Optional<LayoutActionUpdateDTO> secondActionUpdateOptional = actionUpdates.stream().filter(actionUpdate -> actionUpdate.getName().equals("secondAction")).findFirst();
                    LayoutActionUpdateDTO secondActionUpdate = secondActionUpdateOptional.get();
                    assertThat(secondActionUpdate).isNotNull();
                    assertThat(secondActionUpdate.getExecuteOnLoad()).isTrue();
                })
                .verifyComplete();

        StepVerifier.create(newActionService.findById(createdAction1.getId()))
                .assertNext(newAction -> assertThat(newAction.getUnpublishedAction().getExecuteOnLoad()).isFalse());

        StepVerifier.create(newActionService.findById(createdAction2.getId()))
                .assertNext(newAction -> assertThat(newAction.getUnpublishedAction().getExecuteOnLoad()).isTrue());

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnUpdateActionEvent() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("query1");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> resultMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    Datasource ds = new Datasource();
                    ds.setName("testName");
                    ds.setWorkspaceId(datasource.getWorkspaceId());
                    ds.setDatasourceConfiguration(new DatasourceConfiguration());
                    ds.getDatasourceConfiguration().setUrl("http://localhost");
                    ds.setPluginId(datasource.getPluginId());
                    updates.setDatasource(ds);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                });

        StepVerifier
                .create(resultMono)
                .assertNext(resultAction -> {
                    assertThat(resultAction.getDatasource().getMessages().size()).isNotZero();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may " +
                            "use ngrok to expose your local endpoint to the internet. Please check out " +
                            "Appsmith's documentation to understand more.";
                    assertThat(resultAction.getDatasource().getMessages().stream()
                            .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void tableWidgetKeyEscape() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Map primaryColumns = new HashMap<String, Object>();
        JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
        primaryColumns.put("_id", jsonObject);
        primaryColumns.put("_class", jsonObject);
        dsl.put("primaryColumns", primaryColumns);
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout).cache();

        Mono<PageDTO> pageFromRepoMono = updateLayoutMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(Mono.zip(updateLayoutMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    Map primaryColumns1 = (Map) updatedLayout.getDsl().get("primaryColumns");
                    assertThat(primaryColumns1.keySet()).containsAll(Set.of(FieldName.MONGO_UNESCAPED_ID, FieldName.MONGO_UNESCAPED_CLASS));

                    Map primaryColumns2 = (Map) pageFromRepo.getLayouts().get(0).getDsl().get("primaryColumns");
                    assertThat(primaryColumns2.keySet()).containsAll(Set.of(FieldName.MONGO_ESCAPE_ID, FieldName.MONGO_ESCAPE_CLASS));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testIsNameAllowed_withRepeatedActionCollectionName_throwsError() {
        Mockito.doReturn(Flux.empty()).when(newActionService).getUnpublishedActions(Mockito.any());

        ActionCollectionDTO mockActionCollectionDTO = new ActionCollectionDTO();
        mockActionCollectionDTO.setName("testCollection");

        Mockito.when(actionCollectionService.getActionCollectionsByViewMode(Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Flux.just(mockActionCollectionDTO));

        Mono<Boolean> nameAllowedMono = layoutActionService.isNameAllowed(testPage.getId(), testPage.getLayouts().get(0).getId(), "testCollection");

        StepVerifier.create(nameAllowedMono)
                .assertNext(Assertions::assertFalse)
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void duplicateActionNameCreation() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        String name = "query1";

        ActionDTO action = new ActionDTO();
        action.setName(name);
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ActionDTO duplicateAction = new ActionDTO();
        duplicateAction.setName(name);
        duplicateAction.setPageId(testPage.getId());
        duplicateAction.setActionConfiguration(actionConfiguration);
        duplicateAction.setDatasource(datasource);

        Mono<ActionDTO> duplicateActionMono = layoutActionService.createSingleAction(duplicateAction, Boolean.FALSE);

        StepVerifier
                .create(duplicateActionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage(name, FieldName.NAME)))
                .verify();
    }

    @SneakyThrows
    @Test
    @WithUserDetails(value = "api_user")
    public void OnLoadActionsWhenActionDependentOnActionViaWidget() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        /*
         * The left entity depends on the entity on the right
         * firstWidget <- firstAction
         * secondWidget <- firstWidget
         * secondAction <- secondWidget
         * thirdWidget <- secondAction
         *
         * Since firstWidget and thirdWidget are getting data from actions firstAction and secondAction, they both
         * should exist in onPageLoadActions.
         *
         * But there is an implicit dependency :
         * secondAction <- firstAction
         * This is because :
         * thirdWidget <- secondAction <- secondWidget <- firstWidget <- firstAction
         */

        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        actionConfiguration2.setBody("{{secondWidget.data}}");
        action2.setActionConfiguration(actionConfiguration2);
        action2.setDynamicBindingPathList(List.of(new Property("body", null)));
        action2.setDatasource(datasource);

        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstAction.data }}");
        children.add(firstWidget);

        JSONObject secondWidget = new JSONObject();
        secondWidget.put("widgetName", "secondWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        secondWidget.put("dynamicBindingPathList", temp);
        secondWidget.put("testField", "{{ firstWidget.testField }}");
        children.add(secondWidget);

        JSONObject thirdWidget = new JSONObject();
        thirdWidget.put("widgetName", "thirdWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        thirdWidget.put("dynamicBindingPathList", temp);
        thirdWidget.put("testField", "{{ secondAction.data }}");
        children.add(thirdWidget);

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    // Assert that both the actions don't belong to the same set. They should be run iteratively.
                    DslActionDTO actionDTO = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("firstAction");

                    actionDTO = updatedLayout.getLayoutOnLoadActions().get(1).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("secondAction");

                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void simpleOnPageLoadActionCreationTest() throws JsonProcessingException {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // This action should be tagged as on page load since it is used by firstWidget
        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        // Gen action which does not get used anywhere but depends implicitly on first action and has been set to run on load
        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        actionConfiguration2.setBody("{{ firstAction.data }}");
        action2.setUserSetOnLoad(true);
        action2.setActionConfiguration(actionConfiguration2);
        action2.setDynamicBindingPathList(List.of(new Property("body", null)));
        action2.setDatasource(datasource);

        // Gen action which does not get used anywhere but has been set to run on load
        ActionDTO action3 = new ActionDTO();
        action3.setName("thirdAction");
        action3.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setHttpMethod(HttpMethod.GET);
        actionConfiguration3.setBody("irrelevantValue");
        action3.setUserSetOnLoad(true);
        action3.setActionConfiguration(actionConfiguration3);
        action3.setDynamicBindingPathList(List.of(new Property("body", null)));
        action3.setDatasource(datasource);

        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstAction.data }}");
        children.add(firstWidget);

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();

                    // Configure action to execute on page load.
                    updates.setExecuteOnLoad(true);

                    // Save updated configuration and re-compute on page load actions.
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                }).block();
        ActionDTO createdAction3 = layoutActionService.createSingleAction(action3, Boolean.FALSE)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();

                    // Configure action to execute on page load.
                    updates.setExecuteOnLoad(true);

                    // Save updated configuration and re-compute on page load actions.
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates)
                            .flatMap(updatedAction -> layoutActionService.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                }).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    // Assert that all three the actions dont belong to the same set
                    final Set<DslActionDTO> firstSet = updatedLayout.getLayoutOnLoadActions().get(0);
                    assertThat(firstSet).allMatch(actionDTO -> Set.of("firstAction", "thirdAction").contains(actionDTO.getName()));
                    final DslActionDTO secondSetAction = updatedLayout.getLayoutOnLoadActions().get(1).iterator().next();
                    assertThat(secondSetAction.getName()).isEqualTo("secondAction");

                })
                .verifyComplete();

    }

    @SneakyThrows
    @Test
    @WithUserDetails(value = "api_user")
    public void OnLoadActionsWhenActionDependentOnWidgetButNotPageLoadCandidate() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        /*
         * The left entity depends on the entity on the right
         * firstWidget <- firstAction
         * secondWidget <- firstWidget
         * secondAction <- secondWidget
         *
         * Since firstWidget is getting data from action firstAction, it
         * should exist in onPageLoadActions.
         *
         * But there is an implicit dependency :
         * secondAction <- firstAction
         * This is because :
         * secondAction <- secondWidget <- firstWidget <- firstAction
         */

        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        actionConfiguration2.setBody("{{secondWidget.data}}");
        action2.setActionConfiguration(actionConfiguration2);
        action2.setDynamicBindingPathList(List.of(new Property("body", null)));
        action2.setDatasource(datasource);

        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstAction.data }}");
        children.add(firstWidget);

        JSONObject secondWidget = new JSONObject();
        secondWidget.put("widgetName", "secondWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        secondWidget.put("dynamicBindingPathList", temp);
        secondWidget.put("testField", "{{ firstWidget.testField }}");
        children.add(secondWidget);

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    DslActionDTO actionDTO = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("firstAction");

                })
                .verifyComplete();

    }

    @SneakyThrows(JsonProcessingException.class)
    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayout_withSelfReferencingWidget_updatesLayout() {
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstWidget.testField }}");
        children.add(firstWidget);

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);


        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(layoutDTO -> {
                    final JSONObject dsl = layoutDTO.getDsl();
                    final Object fieldValue = ((JSONObject) ((ArrayList) dsl.get("children")).get(0)).getAsString("testField");
                    // Make sure the DSL got updated
                    assertEquals("{{ firstWidget.testField }}", fieldValue);
                })
                .verifyComplete();
    }

    @SneakyThrows(JsonProcessingException.class)
    @Test
    @WithUserDetails(value = "api_user")
    public void updateMultipleLayouts_MultipleLayouts_LayoutsUpdated() {
        // clone the current page to create another page for testing
        PageDTO secondPage = applicationPageService.clonePage(testPage.getId()).block();

        List<PageDTO> testPages = List.of(testPage, secondPage);
        UpdateMultiplePageLayoutDTO multiplePageLayoutDTO = new UpdateMultiplePageLayoutDTO();
        multiplePageLayoutDTO.setPageLayouts(new ArrayList<>());

        for (int i = 0; i < testPages.size(); i++) {
            PageDTO page = testPages.get(i);
            Layout layout = page.getLayouts().get(0);
            layout.setDsl(createTestDslWithTestWidget("Layout"+(i+1)));

            UpdateMultiplePageLayoutDTO.UpdatePageLayoutDTO pageLayoutDTO = new UpdateMultiplePageLayoutDTO.UpdatePageLayoutDTO();
            pageLayoutDTO.setPageId(page.getId());
            pageLayoutDTO.setLayoutId(layout.getId());
            pageLayoutDTO.setLayout(layout);
            multiplePageLayoutDTO.getPageLayouts().add(pageLayoutDTO);
        }
        Mono<Tuple2<PageDTO, PageDTO>> pagesMono = Mono.zip(
                newPageService.findPageById(testPage.getId(), READ_PAGES, false),
                newPageService.findPageById(secondPage.getId(), READ_PAGES, false)
        );

        Mono<Tuple2<PageDTO, PageDTO>> updateAndGetPagesMono = layoutActionService.updateMultipleLayouts(testApp.getId(), null, multiplePageLayoutDTO)
                .then(pagesMono);

        StepVerifier.create(updateAndGetPagesMono)
                .assertNext(objects -> {
                    // verify that the layout of each page has been updated
                    JSONObject dsl1 = objects.getT1().getLayouts().get(0).getDsl();
                    JSONObject dsl2 = objects.getT2().getLayouts().get(0).getDsl();
                    ArrayList<LinkedHashMap> childArray1 = (ArrayList) dsl1.get("children");
                    ArrayList<LinkedHashMap> childArray2 = (ArrayList) dsl2.get("children");

                    assertEquals(childArray1.size(), 1);
                    assertEquals(childArray2.size(), 1);

                    LinkedHashMap<String, String> widget1 = childArray1.get(0);
                    LinkedHashMap<String, String> widget2 = childArray2.get(0);
                    List<String> widgetNames = List.of(
                            widget1.get("widgetName"),
                            widget2.get("widgetName")
                    );
                    assertThat(widgetNames).contains("Layout1", "Layout2");
                }).verifyComplete();
    }

    /**
     * This method tests the following case:
     * o create action1 and action2.
     * o make action2 dependent on action1 by adding {{action1.data}} in action2's body.
     * o set both action1 and action2 to run on page load via settings tab. Do not reference action1 and action2 data
     * in any other widget or action.
     *
     * @throws JsonProcessingException
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testExecuteOnPageLoadOrderWhenAllActionsAreOnlyExplicitlySetToExecute() throws JsonProcessingException {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Configure action1
        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setExecuteOnLoad(true);
        action1.setDatasource(datasource);

        // Configure action2
        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        actionConfiguration2.setBody("{{ firstAction.data }}"); // make action2 dependent on action1
        action2.setActionConfiguration(actionConfiguration2);
        action2.setDynamicBindingPathList(List.of(new Property("body", null)));
        action2.setExecuteOnLoad(true);
        action2.setDatasource(datasource);

        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block(); // create action1
        assertNotNull(createdAction1);
        createdAction1.setExecuteOnLoad(true); // this can only be set to true post action creation.
        NewAction newAction1 = new NewAction();
        newAction1.setUnpublishedAction(createdAction1);
        newAction1.setDefaultResources(createdAction1.getDefaultResources());
        newAction1.setPluginId(installed_plugin.getId());
        newAction1.setPluginType(installed_plugin.getType());

        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2, Boolean.FALSE).block(); // create action2
        assertNotNull(createdAction1);
        createdAction2.setExecuteOnLoad(true); // this can only be set to true post action creation.
        NewAction newAction2 = new NewAction();
        newAction2.setUnpublishedAction(createdAction2);
        newAction2.setDefaultResources(createdAction2.getDefaultResources());
        newAction2.setPluginId(installed_plugin.getId());
        newAction2.setPluginType(installed_plugin.getType());

        NewAction[] newActionArray = new NewAction[2];
        newActionArray[0] = newAction1;
        newActionArray[1] = newAction2;
        Flux<NewAction> newActionFlux = Flux.fromArray(newActionArray);
        Mockito.when(newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(Mockito.any())).thenReturn(newActionFlux);

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    // Assert that both the actions don't belong to the same set. They should be run iteratively.
                    DslActionDTO actionDTO1 = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO1.getName()).isEqualTo("firstAction");

                    DslActionDTO actionDTO2 = updatedLayout.getLayoutOnLoadActions().get(1).iterator().next();
                    assertThat(actionDTO2.getName()).isEqualTo("secondAction");

                })
                .verifyComplete();
    }

    /**
     * This method tests the following scenario:
     * o create `action1`.
     * o set `action1` to run on page load via settings tab.
     * o bind `{{action1.data}}` in one of the widget fields.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void updateLayout_WhenPageLoadActionSetBothWaysExplicitlyAndImplicitlyViaWidget_ActionsSaved() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ firstAction.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1, Boolean.FALSE).block();
        assertNotNull(createdAction1);
        createdAction1.setExecuteOnLoad(true); // this can only be set to true post action creation.
        createdAction1.setUserSetOnLoad(true);
        NewAction newAction1 = new NewAction();
        newAction1.setUnpublishedAction(createdAction1);
        newAction1.setDefaultResources(createdAction1.getDefaultResources());
        newAction1.setPluginId(installed_plugin.getId());
        newAction1.setPluginType(installed_plugin.getType());

        NewAction[] newActionArray = new NewAction[1];
        newActionArray[0] = newAction1;
        Flux<NewAction> newActionFlux = Flux.fromArray(newActionArray);
        Mockito.when(newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(Mockito.any())).thenReturn(newActionFlux);

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    // Assert that both the actions don't belong to the same set. They should be run iteratively.
                    DslActionDTO actionDTO1 = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO1.getName()).isEqualTo("firstAction");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void introduceCyclicDependencyAndRemoveLater() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // creating new action based on which we will introduce cyclic dependency
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName("actionName");
        actionDTO.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setDatasource(datasource);
        actionDTO.setExecuteOnLoad(true);

        ActionDTO createdAction = layoutActionService.createSingleAction(actionDTO, Boolean.FALSE).block();

        // retrieving layout from test page;
        Layout layout = testPage.getLayouts().get(0);

        JSONObject mainDsl = layout.getDsl();
        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "inputWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "defaultText")));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("defaultText", "{{\n" +
                "(function(){\n" +
                "\tlet inputWidget = \"abc\";\n" +
                "\treturn actionName.data;\n" +
                "})()\n" +
                "}}");

        final JSONObject innerObjectReference = new JSONObject();
        innerObjectReference.put("k", "{{\tactionName.data[0].inputWidget}}");

        final JSONArray innerArrayReference = new JSONArray();
        innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tactionName.data[0].inputWidget}}")));

        dsl.put("innerArrayReference", innerArrayReference);
        dsl.put("innerObjectReference", innerObjectReference);

        final ArrayList<Object> objects = new ArrayList<>();
        objects.add(dsl);

        mainDsl.put("children", objects);
        layout.setDsl(mainDsl);

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        // by default there should be no error in the layout, hence no error should be sent to ActionDTO/ errorReports will be null
        assertNotNull(createdAction);
        assertNull(createdAction.getErrorReports());

        // since the dependency has been introduced calling updateLayout will return a LayoutDTO with a populated layoutOnLoadActionErrors
        assertNotNull(firstLayout);
        assertEquals(1, firstLayout.getLayoutOnLoadActionErrors().size());

        // refactoring action to carry the existing error in DSL
        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setOldName("actionName");
        refactorActionNameDTO.setNewName("newActionName");
        refactorActionNameDTO.setLayoutId(layout.getId());
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setActionId(createdAction.getId());

        Mono<LayoutDTO> layoutDTOMono = refactoringSolution.refactorActionName(refactorActionNameDTO);
        StepVerifier.create(layoutDTOMono.map(layoutDTO -> layoutDTO.getLayoutOnLoadActionErrors().size()))
                .expectNext(1)
                .verifyComplete();

        // updateAction to see if the error persists
        actionDTO.setName("finalActionName");
        Mono<ActionDTO> actionDTOMono = layoutActionService.updateSingleActionWithBranchName(createdAction.getId(), actionDTO, null);

        StepVerifier.create(actionDTOMono.map(actionDTO1 -> actionDTO1.getErrorReports().size()))
                .expectNext(1)
                .verifyComplete();


        JSONObject newDsl = new JSONObject();
        newDsl.put("widgetName", "newInputWidget");
        newDsl.put("innerArrayReference", innerArrayReference);
        newDsl.put("innerObjectReference", innerObjectReference);

        objects.remove(0);
        objects.add(newDsl);
        mainDsl.put("children", objects);

        layout.setDsl(mainDsl);

        LayoutDTO changedLayoutDTO = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();
        assertNotNull(changedLayoutDTO);
        assertNotNull(changedLayoutDTO.getLayoutOnLoadActionErrors());
        assertEquals(0, changedLayoutDTO.getLayoutOnLoadActionErrors().size());

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void jsActionWithoutCollectionIdShouldBeIgnoredDuringNameChecking() {
        ActionDTO firstAction = new ActionDTO();
        firstAction.setPluginType(PluginType.JS);
        firstAction.setName("foo");
        firstAction.setFullyQualifiedName("testCollection.foo");
        firstAction.setCollectionId("collectionId");

        ActionDTO secondAction = new ActionDTO();
        secondAction.setPluginType(PluginType.JS);
        secondAction.setName("bar");
        secondAction.setFullyQualifiedName("testCollection.bar");
        secondAction.setCollectionId(null);


        Mockito.doReturn(Flux.just(firstAction, secondAction)).when(newActionService).getUnpublishedActions(Mockito.any());

        ActionCollectionDTO mockActionCollectionDTO = new ActionCollectionDTO();
        mockActionCollectionDTO.setName("testCollection");
        mockActionCollectionDTO.setActions(List.of(firstAction, secondAction));

        Mockito.when(actionCollectionService.getActionCollectionsByViewMode(Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Flux.just(mockActionCollectionDTO));

        Mono<Boolean> nameAllowedMono = layoutActionService.isNameAllowed(testPage.getId(), testPage.getLayouts().get(0).getId(), "testCollection.bar");

        StepVerifier.create(nameAllowedMono)
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }

    /**
     * Creates a DSL JSON based on the provided parameters
     * @return JSONObject of the DSL
     */
    private JSONObject createTestDslWithTestWidget(String testWidgetName) throws JsonProcessingException {
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", testWidgetName);

        ArrayList<JSONObject> children = (ArrayList) parentDsl.get("children");
        children.add(firstWidget);
        parentDsl.put("children", children);
        return parentDsl;
    }
}
