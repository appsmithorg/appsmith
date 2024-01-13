package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
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
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
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
    RefactoringService refactoringService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ActionCollectionRepository actionCollectionRepository;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    PluginService pluginService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationService applicationService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    Application testApp = null;

    PageDTO testPage = null;

    Datasource datasource;

    String workspaceId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        assert apiUser != null;
        Workspace toCreate = new Workspace();
        toCreate.setName("ActionCollectionServiceTest");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        // Create application and page which will be used by the tests to create actions for.
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());

        testApp = applicationPageService
                .createApplication(application, workspaceId)
                .block();

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
        temp2.add(new JSONObject(Map.of("key", "primaryColumns._id")));
        dsl2.put("dynamicBindingPathList", temp2);
        objects.add(dsl2);
        dsl.put("children", objects);

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        PluginWorkspaceDTO pluginWorkspaceDTO = new PluginWorkspaceDTO();
        pluginWorkspaceDTO.setPluginId(installedJsPlugin.getId());
        pluginWorkspaceDTO.setWorkspaceId(workspaceId);
        pluginWorkspaceDTO.setStatus(WorkspacePluginStatus.FREE);
        pluginService.installPlugin(pluginWorkspaceDTO).block();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        datasource.setPluginId(installedJsPlugin.getId());
    }

    @AfterEach
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionCollection() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setWorkspaceId(testApp.getWorkspaceId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        StepVerifier.create(layoutCollectionService.createCollection(actionCollectionDTO, null))
                .assertNext(actionCollectionDTO1 -> {
                    assertThat(actionCollectionDTO1.getApplicationId()).isEqualTo(testApp.getId());
                    assertThat(actionCollectionDTO1.getWorkspaceId()).isEqualTo(testApp.getWorkspaceId());
                    assertThat(actionCollectionDTO1.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionCollectionDTO1.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(actionCollectionDTO1.getUserPermissions()).isNotEmpty();
                })
                .verifyComplete();
    }

    /**
     * Test to verify soft-deleted actionCollections are not retrieved in repository find methods.
     * This issue was observed when deprecated soft-delete field "deleted" is set to "false" and current field "deletedAt"
     * contains a non-null value.
     * Here deletedAt field is manually set to a non-null value instead of deleting actionCollection since that would
     * update both fields.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionCollection_verifySoftDeletedCollectionIsNotLoaded() {
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        assert createdApplication != null;
        final String pageId = createdApplication.getPages().get(0).getId();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollectionSoftDeleted");
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(createdApplication.getWorkspaceId());
        actionCollectionDTO.setPageId(pageId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setDeletedAt(Instant.now());
        layoutCollectionService.createCollection(actionCollectionDTO, null).block();
        ActionCollection createdActionCollection = actionCollectionRepository
                .findByApplicationId(createdApplication.getId(), READ_ACTIONS, null)
                .blockFirst();
        createdActionCollection.setDeletedAt(Instant.now());
        actionCollectionRepository.save(createdActionCollection).block();

        StepVerifier.create(
                        actionCollectionRepository.findByApplicationId(createdApplication.getId(), READ_ACTIONS, null))
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionCollectionAndCheckPermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setWorkspaceId(testApp.getWorkspaceId());
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        Mono<ActionCollection> actionCollectionMono = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .flatMap(
                        createdCollection -> actionCollectionService.findById(createdCollection.getId(), READ_ACTIONS));

        StepVerifier.create(Mono.zip(actionCollectionMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    ActionCollection createdActionCollection = tuple.getT1();
                    assertThat(createdActionCollection.getId()).isNotEmpty();
                    assertThat(createdActionCollection
                                    .getUnpublishedCollection()
                                    .getName())
                            .isEqualTo(actionCollectionDTO.getName());

                    List<PermissionGroup> permissionGroups = tuple.getT2();
                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageActionPolicy = Policy.builder()
                            .permission(MANAGE_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readActionPolicy = Policy.builder()
                            .permission(READ_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeActionPolicy = Policy.builder()
                            .permission(EXECUTE_ACTIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(createdActionCollection.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));
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
        actionCollectionDTO1.setWorkspaceId(workspaceId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);
        actionCollectionDTO1.setBody("export default { x: 1 }");

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService
                .createCollection(actionCollectionDTO1, null)
                .block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName("testCollection2");
        actionCollectionDTO2.setPageId(testPage.getId());
        actionCollectionDTO2.setApplicationId(testApp.getId());
        actionCollectionDTO2.setWorkspaceId(workspaceId);
        actionCollectionDTO2.setPluginId(datasource.getPluginId());
        ActionDTO action2 = new ActionDTO();
        action2.setActionConfiguration(new ActionConfiguration());
        action2.setName("testAction2");
        action2.getActionConfiguration().setBody("testCollection1.testAction1()");
        actionCollectionDTO2.setActions(List.of(action2));
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setBody("export default { x: testCollection1.testAction1() }");

        final ActionCollectionDTO createdActionCollectionDTO2 = layoutCollectionService
                .createCollection(actionCollectionDTO2, null)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.JS_ACTION);
        assert createdActionCollectionDTO1 != null;
        refactorActionNameDTO.setActionCollection(createdActionCollectionDTO1);
        refactorActionNameDTO.setActionId(createdActionCollectionDTO1.getActions().stream()
                .findFirst()
                .get()
                .getId());
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(testPage.getLayouts().get(0).getId());
        refactorActionNameDTO.setCollectionName("testCollection1");
        refactorActionNameDTO.setOldName("testAction1");
        refactorActionNameDTO.setNewName("newTestAction1");

        final LayoutDTO layoutDTO = refactoringService
                .refactorEntityName(refactorActionNameDTO, null)
                .block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getById(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    assertEquals(
                            "export default { x: testCollection1.newTestAction1() }",
                            actionCollection.getUnpublishedCollection().getBody());
                })
                .verifyComplete();

        final Mono<NewAction> actionMono = newActionService.getById(createdActionCollectionDTO2.getActions().stream()
                .findFirst()
                .get()
                .getId());

        StepVerifier.create(actionMono)
                .assertNext(action -> {
                    assertEquals(
                            "testCollection1.newTestAction1()",
                            action.getUnpublishedAction()
                                    .getActionConfiguration()
                                    .getBody());
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
        actionCollectionDTO1.setWorkspaceId(workspaceId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("run");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);
        actionCollectionDTO1.setBody("export default { x: 1 }");

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService
                .createCollection(actionCollectionDTO1, null)
                .block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName("testCollection2");
        actionCollectionDTO2.setPageId(testPage.getId());
        actionCollectionDTO2.setApplicationId(testApp.getId());
        actionCollectionDTO2.setWorkspaceId(workspaceId);
        actionCollectionDTO2.setPluginId(datasource.getPluginId());
        ActionDTO action2 = new ActionDTO();
        action2.setActionConfiguration(new ActionConfiguration());
        action2.setName("testAction2");
        action2.getActionConfiguration().setBody("Api1.run()");
        actionCollectionDTO2.setActions(List.of(action2));
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setBody("export default { x: Api1.run() }");

        final ActionCollectionDTO createdActionCollectionDTO2 = layoutCollectionService
                .createCollection(actionCollectionDTO2, null)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.JS_ACTION);
        assert createdActionCollectionDTO1 != null;
        refactorActionNameDTO.setActionCollection(createdActionCollectionDTO1);
        refactorActionNameDTO.setActionId(createdActionCollectionDTO1.getActions().stream()
                .findFirst()
                .get()
                .getId());
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(testPage.getLayouts().get(0).getId());
        refactorActionNameDTO.setCollectionName("testCollection1");
        refactorActionNameDTO.setOldName("run");
        refactorActionNameDTO.setNewName("newRun");

        final LayoutDTO layoutDTO = refactoringService
                .refactorEntityName(refactorActionNameDTO, null)
                .block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getById(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    assertEquals(
                            "export default { x: Api1.run() }",
                            actionCollection.getUnpublishedCollection().getBody());
                })
                .verifyComplete();

        final Mono<NewAction> actionMono = newActionService.getById(createdActionCollectionDTO2.getActions().stream()
                .findFirst()
                .get()
                .getId());

        StepVerifier.create(actionMono)
                .assertNext(action -> {
                    assertEquals(
                            "Api1.run()",
                            action.getUnpublishedAction()
                                    .getActionConfiguration()
                                    .getBody());
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
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        action1.getActionConfiguration().setIsValid(false);
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();
        assert createdActionCollectionDTO != null;

        final Mono<List<ActionCollectionViewDTO>> viewModeCollectionsMono = applicationPageService
                .publish(testApp.getId(), true)
                .thenMany(actionCollectionService.getActionCollectionsForViewMode(testApp.getId(), null))
                .collectList();

        StepVerifier.create(viewModeCollectionsMono)
                .assertNext(viewModeCollections -> {
                    assertThat(viewModeCollections.size()).isEqualTo(1);

                    final ActionCollectionViewDTO actionCollectionViewDTO = viewModeCollections.get(0);

                    // Actions
                    final List<ActionDTO> actions = actionCollectionViewDTO.getActions();
                    assertThat(actions.size()).isEqualTo(1);
                    assertThat(actions.get(0).getActionConfiguration().getBody())
                            .isEqualTo("mockBody");

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
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("collectionBody");
        ActionDTO action1 = new ActionDTO();
        action1.setName("deleteTestAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();
        assert createdActionCollectionDTO != null;

        final Mono<List<ActionCollectionViewDTO>> viewModeCollectionsMono = applicationPageService
                .publish(testApp.getId(), true)
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
