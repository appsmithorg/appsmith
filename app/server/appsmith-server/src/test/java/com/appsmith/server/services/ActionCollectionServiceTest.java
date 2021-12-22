package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
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
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ActionCollectionServiceTest {

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    UserOrganizationService userOrganizationService;

    @Autowired
    NewActionService newActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    Application testApp = null;

    PageDTO testPage = null;

    Datasource datasource;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        assert apiUser != null;
        orgId = apiUser.getOrganizationIds().iterator().next();
        Organization organization = organizationService.getById(orgId).block();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            assert organization != null;
            testApp = applicationPageService.createApplication(application, organization.getId()).block();

            assert testApp != null;
            final String pageId = testApp.getPages().get(0).getId();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

            assert testPage != null;
            Layout layout = testPage.getLayouts().get(0);
            JSONObject dsl = new JSONObject(Map.of("text", "{{ query1.data }}"));

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
        }

        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        assert testOrg != null;
        orgId = testOrg.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setOrganizationId(orgId);
        Plugin installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        datasource.setPluginId(installedJsPlugin.getId());
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
    public void createValidActionCollectionAndCheckPermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(testApp.getOrganizationId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        Mono<ActionCollection> actionCollectionMono = layoutCollectionService.createCollection(actionCollectionDTO)
                .flatMap(createdCollection -> actionCollectionService.findById(createdCollection.getId(), READ_ACTIONS));

        StepVerifier
                .create(actionCollectionMono)
                .assertNext(createdActionCollection -> {
                    assertThat(createdActionCollection.getId()).isNotEmpty();
                    assertThat(createdActionCollection.getUnpublishedCollection().getName()).isEqualTo(actionCollectionDTO.getName());
                    assertThat(createdActionCollection.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToOrganizationAsAdminAndCheckActionCollectionPermissions() {

        // Create action collection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(testApp.getOrganizationId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        ActionCollectionDTO actionCollection =
                layoutCollectionService.createCollection(actionCollectionDTO).block();

        UserRole userRole = new UserRole();
        userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
        userRole.setUsername("usertest@usertest.com");

        userOrganizationService.addUserRoleToOrganization(testApp.getOrganizationId(), userRole).block();

        assert actionCollection != null;
        Mono<ActionCollection> readActionCollectionMono =
                actionCollectionService.findById(actionCollection.getId(), READ_ACTIONS)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "ActionCollection", actionCollection.getId())));

        StepVerifier
                .create(readActionCollectionMono)
                .assertNext(updatedActionCollection -> {

                    Policy manageActionCollectionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy readActionCollectionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();
                    Policy executeActionCollectionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                            .users(Set.of("api_user", "usertest@usertest.com"))
                            .build();

                    assertThat(updatedActionCollection.getPolicies()).isNotEmpty();
                    assertThat(updatedActionCollection.getPolicies())
                            .containsAll(Set.of(
                                    manageActionCollectionPolicy,
                                    readActionCollectionPolicy,
                                    executeActionCollectionPolicy));

                })
                .verifyComplete();
    }

    /**
     * For a given collection testCollection2, that refers to another action testCollection1.testAction1,
     * When testAction1 is renamed to newTestAction1,
     * Then the reference in testCollection2 should also get updated
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void refactorNameForActionRefactorsNameInCollection() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(testPage.getId());
        actionCollectionDTO1.setApplicationId(testApp.getId());
        actionCollectionDTO1.setOrganizationId(orgId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService.createCollection(actionCollectionDTO1).block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName("testCollection2");
        actionCollectionDTO2.setPageId(testPage.getId());
        actionCollectionDTO2.setApplicationId(testApp.getId());
        actionCollectionDTO2.setOrganizationId(orgId);
        actionCollectionDTO2.setPluginId(datasource.getPluginId());
        ActionDTO action2 = new ActionDTO();
        action2.setActionConfiguration(new ActionConfiguration());
        action2.setName("testAction2");
        action2.getActionConfiguration().setBody("testCollection1.testAction1()");
        actionCollectionDTO2.setActions(List.of(action2));
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setBody("testCollection1.testAction1()");

        final ActionCollectionDTO createdActionCollectionDTO2 = layoutCollectionService.createCollection(actionCollectionDTO2).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        assert createdActionCollectionDTO1 != null;
        refactorActionNameDTO.setActionId(createdActionCollectionDTO1.getActions().stream().findFirst().get().getId());
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(testPage.getLayouts().get(0).getId());
        refactorActionNameDTO.setCollectionName("testCollection1");
        refactorActionNameDTO.setOldName("testAction1");
        refactorActionNameDTO.setNewName("newTestAction1");

        final LayoutDTO layoutDTO = layoutActionService.refactorActionName(refactorActionNameDTO).block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono = actionCollectionService.getById(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    Assert.assertEquals(
                            "testCollection1.newTestAction1()",
                            actionCollection.getUnpublishedCollection().getBody()
                    );
                })
                .verifyComplete();

        final Mono<NewAction> actionMono = newActionService.getById(createdActionCollectionDTO2.getActions().stream().findFirst().get().getId());

        StepVerifier.create(actionMono)
                .assertNext(action -> {
                    Assert.assertEquals(
                            "testCollection1.newTestAction1()",
                            action.getUnpublishedAction().getActionConfiguration().getBody()
                    );
                })
                .verifyComplete();
    }

    /**
     * For a given collection testCollection2, that refers to another action testCollection1.testAction1,
     * When testAction1 is renamed to newTestAction1,
     * Then the reference in testCollection2 should also get updated
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorActionName_withActionNameEqualsRun_doesNotRefactorApiRunCalls() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(testPage.getId());
        actionCollectionDTO1.setApplicationId(testApp.getId());
        actionCollectionDTO1.setOrganizationId(orgId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("run");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService.createCollection(actionCollectionDTO1).block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName("testCollection2");
        actionCollectionDTO2.setPageId(testPage.getId());
        actionCollectionDTO2.setApplicationId(testApp.getId());
        actionCollectionDTO2.setOrganizationId(orgId);
        actionCollectionDTO2.setPluginId(datasource.getPluginId());
        ActionDTO action2 = new ActionDTO();
        action2.setActionConfiguration(new ActionConfiguration());
        action2.setName("testAction2");
        action2.getActionConfiguration().setBody("Api1.run()");
        actionCollectionDTO2.setActions(List.of(action2));
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setBody("Api1.run()");

        final ActionCollectionDTO createdActionCollectionDTO2 = layoutCollectionService.createCollection(actionCollectionDTO2).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        assert createdActionCollectionDTO1 != null;
        refactorActionNameDTO.setActionId(createdActionCollectionDTO1.getActions().stream().findFirst().get().getId());
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(testPage.getLayouts().get(0).getId());
        refactorActionNameDTO.setCollectionName("testCollection1");
        refactorActionNameDTO.setOldName("run");
        refactorActionNameDTO.setNewName("newRun");

        final LayoutDTO layoutDTO = layoutActionService.refactorActionName(refactorActionNameDTO).block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono = actionCollectionService.getById(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    Assert.assertEquals(
                            "Api1.run()",
                            actionCollection.getUnpublishedCollection().getBody()
                    );
                })
                .verifyComplete();

        final Mono<NewAction> actionMono = newActionService.getById(createdActionCollectionDTO2.getActions().stream().findFirst().get().getId());

        StepVerifier.create(actionMono)
                .assertNext(action -> {
                    Assert.assertEquals(
                            "Api1.run()",
                            action.getUnpublishedAction().getActionConfiguration().getBody()
                    );
                })
                .verifyComplete();
    }

    /**
     * For a given collection testCollection1, that refers to another action testCollection1.testAction1,
     * When the page with this collection is published,
     * Then the view mode collection should contain actions and variables
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testActionCollectionInViewMode() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection1");
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(orgId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;

        final Mono<List<ActionCollectionViewDTO>> viewModeCollectionsMono = applicationPageService.publish(testApp.getId(), true)
                .thenMany(actionCollectionService.getActionCollectionsForViewMode(testApp.getId(), null))
                .collectList();

        StepVerifier.create(viewModeCollectionsMono)
                .assertNext(viewModeCollections -> {
                    assertThat(viewModeCollections.size()).isEqualTo(1);

                    final ActionCollectionViewDTO actionCollectionViewDTO = viewModeCollections.get(0);

                    // Actions
                    final List<ActionDTO> actions = actionCollectionViewDTO.getActions();
                    assertThat(actions.size()).isEqualTo(1);
                    assertThat(actions.get(0).getActionConfiguration().getBody()).isEqualTo("mockBody");

                    // Variables
                    final List<JSValue> variables = actionCollectionViewDTO.getVariables();
                    assertThat(variables.size()).isEqualTo(1);
                    assertThat(variables.get(0).getValue()).isEqualTo("test");

                    // Metadata
                    assertThat(actionCollectionViewDTO.getId()).isEqualTo(createdActionCollectionDTO.getId());
                    assertThat(actionCollectionViewDTO.getName()).isEqualTo("testCollection1");
                    assertThat(actionCollectionViewDTO.getApplicationId()).isEqualTo(testApp.getId());
                    assertThat(actionCollectionViewDTO.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionCollectionViewDTO.getBody()).isEqualTo("collectionBody");

                })
                .verifyComplete();

    }

    /**
     * For a given collection testCollection1,
     * When the page with this collection is published,
     * After the testCollection is deleted in edit mode and application is published again,
     * Then the view mode should not contain testCollection
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testDeleteActionCollection_afterApplicationPublish_clearsActionCollection() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("deleteTestCollection1");
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setOrganizationId(orgId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("deleteTestAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;

        final Mono<List<ActionCollectionViewDTO>> viewModeCollectionsMono = applicationPageService.publish(testApp.getId(), true)
                .then(actionCollectionService.deleteUnpublishedActionCollection(createdActionCollectionDTO.getId()))
                .then(applicationPageService.publish(testApp.getId(), true))
                .thenMany(actionCollectionService.getActionCollectionsForViewMode(testApp.getId(), null))
                .collectList();

        StepVerifier.create(viewModeCollectionsMono)
                .assertNext(viewModeCollections -> {
                    assertThat(viewModeCollections).isEmpty();
                })
                .verifyComplete();

    }
}
