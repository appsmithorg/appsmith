package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.After;
import org.junit.Assert;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class LayoutActionServiceTest {
    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionRepository actionRepository;

    @Autowired
    ActionCollectionService actionCollectionService;

    Application testApp = null;

    PageDTO testPage = null;

    Datasource datasource;

    Datasource jsDatasource;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        newPageService.deleteAll();
        User apiUser = userService.findByEmail("api_user").block();
        String orgId = apiUser.getOrganizationIds().iterator().next();
        Organization organization = organizationService.getById(orgId).block();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, organization.getId()).block();

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
            dsl.put("testField2", "{{jsObject.data.jsFunction}}");

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
            layoutActionService.updateLayout(pageId, layout.getId(), layout).block();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }

        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS Database");
        jsDatasource.setOrganizationId(orgId);
        Plugin installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());
    }

    @After
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        applicationPageService.deleteApplication(testApp.getId()).block();
        testApp = null;
        testPage = null;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testOnPageLoadActionsAfterActionDelete() {
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
                .createSingleAction(action)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();

                    // Configure action to execute on page load.
                    updates.setExecuteOnLoad(true);

                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);

                    // Save updated configuration and re-compute on page load actions.
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates);
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
        unreferencedAction.setUserSetOnLoad(true);
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
        d2.setOrganizationId(datasource.getOrganizationId());
        d2.setPluginId(datasource.getPluginId());
        d2.setIsAutoGenerated(true);
        d2.setName("UNUSED_DATASOURCE");
        action3.setDatasource(d2);

        Mono<PageDTO> resultMono = layoutActionService
                .createSingleAction(action)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates);
                })
                .flatMap(savedAction -> layoutActionService.createSingleAction(unreferencedAction))
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates);
                })
                .flatMap(savedAction -> layoutActionService.createSingleAction(action3))
                .flatMap(savedAction -> {
                    Assert.assertFalse(savedAction.getActionConfiguration().getIsValid());
                    Assert.assertTrue(savedAction.getInvalids().contains(AppsmithError.INVALID_JS_ACTION.getMessage()));
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates);
                })
                // fetch the unpublished page
                .flatMap(savedAction -> newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(resultMono)
                .assertNext(page -> {
                    assertThat(page.getLayouts()).hasSize(1);
                    assertThat(page.getLayouts().get(0).getLayoutOnLoadActions()).hasSize(1);
                    Set<DslActionDTO> dslActionDTOS = page.getLayouts().get(0).getLayoutOnLoadActions().get(0);
                    assertThat(dslActionDTOS).hasSize(3);
                    assertThat(dslActionDTOS.stream().map(dto -> dto.getName()).collect(Collectors.toSet())).containsAll(Set.of("query1", "query2"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ beforeNameChange.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();


        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("PostNameChange");
        refactorActionNameDTO.setActionId(createdAction.getId());

        LayoutDTO postNameChangeLayout = layoutActionService.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(createdAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("PostNameChange");

                    DslActionDTO actionDTO = postNameChangeLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("PostNameChange");

                    dsl.put("testField", "{{ PostNameChange.data }}");
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionNameToDeletedName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("Query1");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Layout layout = testPage.getLayouts().get(0);

        ActionDTO firstAction = layoutActionService.createSingleAction(action).block();

        layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        applicationPageService.publish(testPage.getApplicationId(), true).block();

        newActionService.deleteUnpublishedAction(firstAction.getId()).block();

        // Create another action with the same name as the erstwhile deleted action
        action.setId(null);
        ActionDTO secondAction = layoutActionService.createSingleAction(action).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("Query1");
        refactorActionNameDTO.setNewName("NewActionName");
        refactorActionNameDTO.setActionId(firstAction.getId());

        layoutActionService.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(secondAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("NewActionName");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorActionName_withInvalidName_throwsError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ beforeNameChange.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        assert firstLayout != null;
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("!PostNameChange");
        assert createdAction != null;
        refactorActionNameDTO.setActionId(createdAction.getId());

        final Mono<LayoutDTO> layoutDTOMono = layoutActionService.refactorActionName(refactorActionNameDTO);

        StepVerifier
                .create(layoutDTOMono)
                .expectErrorMatches(e -> e instanceof AppsmithException &&
                        AppsmithError.INVALID_ACTION_NAME.getMessage().equalsIgnoreCase(e.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void actionExecuteOnLoadChangeOnUpdateLayout() {
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

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    log.debug("{}", updatedLayout.getMessages());
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

        updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

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

        ActionDTO unreferencedAction = new ActionDTO();
        unreferencedAction.setName("query2");
        unreferencedAction.setPageId(testPage.getId());
        unreferencedAction.setUserSetOnLoad(true);
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        unreferencedAction.setActionConfiguration(actionConfiguration2);
        unreferencedAction.setDatasource(datasource);

        Mono<ActionDTO> resultMono = layoutActionService
                .createSingleAction(action)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    Datasource ds = new Datasource();
                    ds.setName("testName");
                    ds.setOrganizationId(datasource.getOrganizationId());
                    ds.setDatasourceConfiguration(new DatasourceConfiguration());
                    ds.getDatasourceConfiguration().setUrl("http://localhost");
                    ds.setPluginId(datasource.getPluginId());
                    updates.setDatasource(ds);
                    return layoutActionService.updateSingleAction(savedAction.getId(), updates);
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

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).cache();

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
    public void refactorDuplicateActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        String name = "duplicateName";

        ActionDTO action = new ActionDTO();
        action.setName(name);
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ duplicateName.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO firstAction = layoutActionService.createSingleAction(action).block();

        ActionDTO duplicateName = new ActionDTO();
        duplicateName.setName(name);
        duplicateName.setPageId(testPage.getId());
        duplicateName.setActionConfiguration(actionConfiguration);
        duplicateName.setDatasource(datasource);

        NewAction duplicateNameCompleteAction = new NewAction();
        duplicateNameCompleteAction.setUnpublishedAction(duplicateName);
        duplicateNameCompleteAction.setPublishedAction(new ActionDTO());
        duplicateNameCompleteAction.getPublishedAction().setDatasource(new Datasource());
        duplicateNameCompleteAction.setOrganizationId(duplicateName.getOrganizationId());
        duplicateNameCompleteAction.setPluginType(duplicateName.getPluginType());
        duplicateNameCompleteAction.setPluginId(duplicateName.getPluginId());
        duplicateNameCompleteAction.setTemplateId(duplicateName.getTemplateId());
        duplicateNameCompleteAction.setProviderId(duplicateName.getProviderId());
        duplicateNameCompleteAction.setDocumentation(duplicateName.getDocumentation());
        duplicateNameCompleteAction.setApplicationId(duplicateName.getApplicationId());

        // Now save this action directly in the repo to create a duplicate action name scenario
        actionRepository.save(duplicateNameCompleteAction).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("duplicateName");
        refactorActionNameDTO.setNewName("newName");
        refactorActionNameDTO.setActionId(firstAction.getId());

        LayoutDTO postNameChangeLayout = layoutActionService.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(firstAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("newName");

                    DslActionDTO actionDTO = postNameChangeLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("newName");

                    dsl.put("testField", "{{ newName.data }}");
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
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

        layoutActionService.createSingleAction(action).block();

        ActionDTO duplicateAction = new ActionDTO();
        duplicateAction.setName(name);
        duplicateAction.setPageId(testPage.getId());
        duplicateAction.setActionConfiguration(actionConfiguration);
        duplicateAction.setDatasource(datasource);

        Mono<ActionDTO> duplicateActionMono = layoutActionService.createSingleAction(duplicateAction);

        StepVerifier
                .create(duplicateActionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage(name, FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void tableWidgetKeyEscapeRefactorName() {
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

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono = layoutActionService.refactorWidgetName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono = widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(Mono.zip(widgetRenameMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    String widgetName = (String) updatedLayout.getDsl().get("widgetName");
                    assertThat(widgetName).isEqualTo("NewNameTable1");

                    Map primaryColumns1 = (Map) updatedLayout.getDsl().get("primaryColumns");
                    assertThat(primaryColumns1.keySet()).containsAll(Set.of(FieldName.MONGO_UNESCAPED_ID, FieldName.MONGO_UNESCAPED_CLASS));

                    Map primaryColumns2 = (Map) pageFromRepo.getLayouts().get(0).getDsl().get("primaryColumns");
                    assertThat(primaryColumns2.keySet()).containsAll(Set.of(FieldName.MONGO_ESCAPE_ID, FieldName.MONGO_ESCAPE_CLASS));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void simpleWidgetNameRefactor() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono = layoutActionService.refactorWidgetName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono = widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(Mono.zip(widgetRenameMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    String widgetName = (String) updatedLayout.getDsl().get("widgetName");
                    assertThat(widgetName).isEqualTo("NewNameTable1");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetNameRefactor_withSimpleUpdate_refactorsActionCollectionAndItsAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Set up table widget in DSL
        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        // Create an action collection that refers to the table
        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(testPage.getId());
        actionCollectionDTO1.setApplicationId(testApp.getId());
        actionCollectionDTO1.setOrganizationId(testApp.getOrganizationId());
        actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("Table1");
        actionCollectionDTO1.setBody("Table1");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService.createCollection(actionCollectionDTO1).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        LayoutDTO updatedLayout = layoutActionService.refactorWidgetName(refactorNameDTO).block();

        assert createdActionCollectionDTO1 != null;
        final Mono<ActionCollection> actionCollectionMono = actionCollectionService.getById(createdActionCollectionDTO1.getId());
        final Optional<String> optional = createdActionCollectionDTO1.getActionIds().stream().findFirst();
        assert optional.isPresent();
        final Mono<NewAction> actionMono = newActionService.findById(optional.get());

        StepVerifier
                .create(Mono.zip(actionCollectionMono, actionMono))
                .assertNext(tuple -> {
                    final ActionCollection actionCollection = tuple.getT1();
                    final NewAction action = tuple.getT2();
                    assertThat(actionCollection.getUnpublishedCollection().getBody()).isEqualTo("NewNameTable1");
                    final ActionDTO unpublishedAction = action.getUnpublishedAction();
                    assertThat(unpublishedAction.getJsonPathKeys().size()).isEqualTo(1);
                    final Optional<String> first = unpublishedAction.getJsonPathKeys().stream().findFirst();
                    assert first.isPresent();
                    assertThat(first.get()).isEqualTo("NewNameTable1");
                    assertThat(unpublishedAction.getActionConfiguration().getBody()).isEqualTo("NewNameTable1");
                })
                .verifyComplete();
    }
}
