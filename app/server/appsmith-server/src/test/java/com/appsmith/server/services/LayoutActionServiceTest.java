package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
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
    LayoutService layoutService;

    @Autowired
    NewPageService newPageService;

    Application testApp = null;

    PageDTO testPage = null;

    Datasource datasource;

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
            temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
            dsl.put("dynamicBindingPathList", temp);
            dsl.put("testField", "{{ query1.data }}");
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
    public void updateActionUpdatesLayout() {
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

        Mono<PageDTO> resultMono = newActionService
                .createAction(action)
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    updates.setDatasource(datasource);
                    return layoutActionService.updateAction(savedAction.getId(), updates);
                })
                .flatMap(savedAction -> newActionService.createAction(unreferencedAction))
                .flatMap(savedAction -> {
                    ActionDTO updates = new ActionDTO();
                    updates.setExecuteOnLoad(true);
                    updates.setPolicies(null);
                    updates.setUserPermissions(null);
                    return layoutActionService.updateAction(savedAction.getId(), updates);
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

        ActionDTO createdAction = newActionService.createAction(action).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();


        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(firstLayout.getId());
        refactorNameDTO.setOldName("beforeNameChange");
        refactorNameDTO.setNewName("PostNameChange");

        LayoutDTO postNameChangeLayout = layoutActionService.refactorActionName(refactorNameDTO).block();

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

        ActionDTO firstAction = newActionService.createAction(action).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout).block();

        applicationPageService.publish(testPage.getApplicationId()).block();

        newActionService.deleteUnpublishedAction(firstAction.getId()).block();

        // Create another action with the same name as the erstwhile deleted action
        action.setId(null);
        ActionDTO secondAction = newActionService.createAction(action).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(firstLayout.getId());
        refactorNameDTO.setOldName("Query1");
        refactorNameDTO.setNewName("NewActionName");

        layoutActionService.refactorActionName(refactorNameDTO).block();

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

        ActionDTO createdAction1 = newActionService.createAction(action1).block();
        ActionDTO createdAction2 = newActionService.createAction(action2).block();

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

        Mono<ActionDTO> resultMono = newActionService
                .createAction(action)
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
                    return layoutActionService.updateAction(savedAction.getId(), updates);
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
}
