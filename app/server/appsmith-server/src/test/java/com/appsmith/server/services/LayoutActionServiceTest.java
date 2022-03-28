package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
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
import com.appsmith.server.dtos.RefactorActionNameInCollectionDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
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
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

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
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@RunWith(SpringRunner.class)
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

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String orgId;

    String branchName;

    Datasource jsDatasource;

    ObjectMapper objectMapper = new ObjectMapper();

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        newPageService.deleteAll();
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
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
            layoutActionService.updateLayout(pageId, layout.getId(), layout).block();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }

        if (gitConnectedApp == null) {
            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("actionServiceTest");
            newApp.setGitApplicationMetadata(gitData);
            gitConnectedApp = applicationPageService.createApplication(newApp, orgId)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application)
                                .zipWhen(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), gitData.getBranchName()));
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(tuple -> importExportApplicationService.importApplicationInOrganization(orgId, tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                    .block();

            gitConnectedPage = newPageService.findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false).block();

            branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
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
                    updates.setDatasource(datasource);
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
                    updates.setDatasource(d2);
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
                    assertThat(dslActionDTOS).hasSize(2);
                    assertThat(dslActionDTOS.stream().map(dto -> dto.getName()).collect(Collectors.toSet())).containsAll(Set.of("query1", "jsObject.jsFunction"));
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
        dsl.put("testField", "{{ \tbeforeNameChange.data }}");
        final JSONObject innerObjectReference = new JSONObject();
        innerObjectReference.put("k", "{{\tbeforeNameChange.data}}");
        dsl.put("innerObjectReference", innerObjectReference);
        final JSONArray innerArrayReference = new JSONArray();
        innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tbeforeNameChange.data}}")));
        dsl.put("innerArrayReference", innerArrayReference);

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

                    dsl.put("testField", "{{ \tPostNameChange.data }}");
                    innerObjectReference.put("k", "{{\tPostNameChange.data}}");
                    innerArrayReference.clear();
                    innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tPostNameChange.data}}")));
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionName_forGitConnectedAction_success() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(gitConnectedPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ \tbeforeNameChange.data }}");
        final JSONObject innerObjectReference = new JSONObject();
        innerObjectReference.put("k", "{{\tbeforeNameChange.data}}");
        dsl.put("innerObjectReference", innerObjectReference);
        final JSONArray innerArrayReference = new JSONArray();
        innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tbeforeNameChange.data}}")));
        dsl.put("innerArrayReference", innerArrayReference);

        Layout layout = gitConnectedPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction = layoutActionService.createSingleAction(action).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(gitConnectedPage.getId(), layout.getId(), layout, branchName).block();


        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(gitConnectedPage.getId());
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

                    dsl.put("testField", "{{ \tPostNameChange.data }}");
                    innerObjectReference.put("k", "{{\tPostNameChange.data}}");
                    innerArrayReference.clear();
                    innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tPostNameChange.data}}")));
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                    assertThat(updatedAction.getDefaultResources()).isNotNull();
                    assertThat(updatedAction.getDefaultResources().getActionId()).isEqualTo(updatedAction.getId());
                    assertThat(updatedAction.getDefaultResources().getApplicationId()).isEqualTo(gitConnectedApp.getId());
                    assertThat(updatedAction.getUnpublishedAction().getDefaultResources().getPageId()).isEqualTo(gitConnectedPage.getId());
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
    public void testRefactorWidgetName_forDefaultWidgetsInList_updatesBothWidgetsAndTemplateReferences() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "List1");
        dsl.put("type", "LIST_WIDGET");
        JSONObject template = new JSONObject();
        template.put("oldWidgetName", "irrelevantContent");
        dsl.put("template", template);
        final JSONArray children = new JSONArray();
        final JSONObject defaultWidget = new JSONObject();
        defaultWidget.put("widgetName", "oldWidgetName");
        defaultWidget.put("type", "TEXT_WIDGET");
        children.add(defaultWidget);
        dsl.put("children", children);
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("oldWidgetName");
        refactorNameDTO.setNewName("newWidgetName");

        Mono<LayoutDTO> widgetRenameMono = layoutActionService.refactorWidgetName(refactorNameDTO).cache();

        StepVerifier
                .create(widgetRenameMono)
                .assertNext(updatedLayout -> {
                    assertTrue(((Map) updatedLayout.getDsl().get("template")).containsKey("newWidgetName"));
                    assertEquals("newWidgetName",
                            ((Map)(((List)updatedLayout.getDsl().get("children")).get(0))).get("widgetName"));
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
        action1.getActionConfiguration().setBody("\tTable1");
        actionCollectionDTO1.setBody("\tTable1");
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
        final Optional<String> optional = createdActionCollectionDTO1.getDefaultToBranchedActionIdsMap().values().stream().findFirst();
        assert optional.isPresent();
        final Mono<NewAction> actionMono = newActionService.findById(optional.get());

        StepVerifier
                .create(Mono.zip(actionCollectionMono, actionMono))
                .assertNext(tuple -> {
                    final ActionCollection actionCollection = tuple.getT1();
                    final NewAction action = tuple.getT2();
                    assertThat(actionCollection.getUnpublishedCollection().getBody()).isEqualTo("\tNewNameTable1");
                    final ActionDTO unpublishedAction = action.getUnpublishedAction();
                    assertThat(unpublishedAction.getJsonPathKeys().size()).isEqualTo(1);
                    final Optional<String> first = unpublishedAction.getJsonPathKeys().stream().findFirst();
                    assert first.isPresent();
                    assertThat(first.get()).isEqualTo("\tNewNameTable1");
                    assertThat(unpublishedAction.getActionConfiguration().getBody()).isEqualTo("\tNewNameTable1");
                })
                .verifyComplete();
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

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(2);

                    // Assert that both the actions dont belong to the same set. They should be run iteratively.
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

        // This action should be tagged as on page load since its used by firstWidget
        ActionDTO action1 = new ActionDTO();
        action1.setName("firstAction");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        // Gen action which does not get used anywhere but depends implicitly on first action
        ActionDTO action2 = new ActionDTO();
        action2.setName("secondAction");
        action2.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        actionConfiguration2.setBody("{{ firstWidget.data }}");
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

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {

                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    // Assert that both the actions dont belong to the same set. They should be run iteratively.
                    DslActionDTO actionDTO = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("firstAction");

                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorCollection_withModifiedName_ignoresName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionCollectionDTO originalActionCollectionDTO = new ActionCollectionDTO();
        originalActionCollectionDTO.setName("originalName");
        originalActionCollectionDTO.setApplicationId(testApp.getId());
        originalActionCollectionDTO.setOrganizationId(testApp.getOrganizationId());
        originalActionCollectionDTO.setPageId(testPage.getId());
        originalActionCollectionDTO.setPluginId(jsDatasource.getPluginId());
        originalActionCollectionDTO.setPluginType(PluginType.JS);

        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("Table1");

        originalActionCollectionDTO.setActions(List.of(action1));

        final ActionCollectionDTO dto = layoutCollectionService.createCollection(originalActionCollectionDTO).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        assert dto != null;
        actionCollectionDTO.setId(dto.getId());
        actionCollectionDTO.setBody("body");
        actionCollectionDTO.setName("newName");

        RefactorActionNameInCollectionDTO refactorActionNameInCollectionDTO = new RefactorActionNameInCollectionDTO();
        refactorActionNameInCollectionDTO.setActionCollection(actionCollectionDTO);
        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO(
                dto.getActions().get(0).getId(),
                testPage.getId(),
                testPage.getLayouts().get(0).getId(),
                "testAction1",
                "newTestAction",
                "originalName"
        );
        refactorActionNameInCollectionDTO.setRefactorAction(refactorActionNameDTO);

        final Mono<Tuple2<ActionCollection, NewAction>> tuple2Mono = layoutCollectionService
                .refactorAction(refactorActionNameInCollectionDTO)
                .then(actionCollectionService.getById(dto.getId())
                        .zipWith(newActionService.findById(dto.getActions().get(0).getId())));

        StepVerifier.create(tuple2Mono)
                .assertNext(tuple -> {
                    final ActionCollectionDTO actionCollectionDTOResult = tuple.getT1().getUnpublishedCollection();
                    final NewAction newAction = tuple.getT2();
                    assertEquals("originalName", actionCollectionDTOResult.getName());
                    assertEquals("body", actionCollectionDTOResult.getBody());
                    assertEquals("newTestAction", newAction.getUnpublishedAction().getName());
                    assertEquals("originalName.newTestAction", newAction.getUnpublishedAction().getFullyQualifiedName());
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

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block();
        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2).block();

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

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
    public void testUpdateLayout_withSelfReferencingWidget_updatesLayout() {
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));

        ArrayList children = (ArrayList) parentDsl.get("children");

        JSONObject firstWidget = new JSONObject();
        firstWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        firstWidget.put("dynamicBindingPathList", temp);
        firstWidget.put("testField", "{{ firstWidget.testField }}");
        children.add(firstWidget);

        parentDsl.put("children", children);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);


        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(layoutDTO -> {
                    final JSONObject dsl = layoutDTO.getDsl();
                    final Object fieldValue = ((JSONObject) ((ArrayList) dsl.get("children")).get(0)).getAsString("testField");
                    // Make sure the DSL got updated
                    Assert.assertEquals("{{ firstWidget.testField }}", fieldValue);
                })
                .verifyComplete();
    }

    /**
     * This method tests the following case:
     * o create action1 and action2.
     * o make action2 dependent on action1 by adding {{action1.data}} in action2's body.
     * o set both action1 and action2 to run on page load via settings tab. Do not reference action1 and action2 data
     * in any other widget or action.
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

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block(); // create action1
        createdAction1.setExecuteOnLoad(true); // this can only be set to true post action creation.
        NewAction newAction1 = new NewAction();
        newAction1.setUnpublishedAction(createdAction1);
        newAction1.setDefaultResources(createdAction1.getDefaultResources());

        ActionDTO createdAction2 = layoutActionService.createSingleAction(action2).block(); // create action2
        createdAction2.setExecuteOnLoad(true); // this can only be set to true post action creation.
        NewAction newAction2 = new NewAction();
        newAction2.setUnpublishedAction(createdAction2);
        newAction2.setDefaultResources(createdAction2.getDefaultResources());

        NewAction[] newActionArray = new NewAction[2];
        newActionArray[0] = newAction1;
        newActionArray[1] = newAction2;
        Flux<NewAction> newActionFlux = Flux.fromArray(newActionArray);
        Mockito.when(newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(Mockito.any())).thenReturn(newActionFlux);

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

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
    public void testPageLoadActionWhenSetBothWaysExplicitlyAndImplicitlyViaWidget() {
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
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ firstAction.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        ActionDTO createdAction1 = layoutActionService.createSingleAction(action1).block();
        createdAction1.setExecuteOnLoad(true); // this can only be set to true post action creation.
        createdAction1.setUserSetOnLoad(true);
        NewAction newAction1 = new NewAction();
        newAction1.setUnpublishedAction(createdAction1);
        newAction1.setDefaultResources(createdAction1.getDefaultResources());

        NewAction[] newActionArray = new NewAction[1];
        newActionArray[0] = newAction1;
        Flux<NewAction> newActionFlux = Flux.fromArray(newActionArray);
        Mockito.when(newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(Mockito.any())).thenReturn(newActionFlux);

        Mono<LayoutDTO> updateLayoutMono = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout);

        StepVerifier.create(updateLayoutMono)
                .assertNext(updatedLayout -> {
                    assertThat(updatedLayout.getLayoutOnLoadActions().size()).isEqualTo(1);

                    // Assert that both the actions don't belong to the same set. They should be run iteratively.
                    DslActionDTO actionDTO1 = updatedLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO1.getName()).isEqualTo("firstAction");
                })
                .verifyComplete();
    }
}
