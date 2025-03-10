package com.appsmith.server.services;

import com.appsmith.external.dtos.DslExecutableDTO;
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
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PluginWorkspaceDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
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
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
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
import java.util.stream.Collectors;

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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @SpyBean
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

    @SpyBean
    UpdateLayoutService updateLayoutService;

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
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
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

        StepVerifier.create(layoutCollectionService.createCollection(actionCollectionDTO))
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
        layoutCollectionService.createCollection(actionCollectionDTO).block();
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
    public void testMoveActionCollection_whenMovedAcrossPages_thenContainsNewPageId() {
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        PageDTO newPageDTO = new PageDTO();
        newPageDTO.setName("newPage");
        newPageDTO.setApplicationId(createdApplication.getId());
        newPageDTO.setLayouts(List.of(new Layout()));
        PageDTO newPageRes = applicationPageService.createPage(newPageDTO).block();

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
        layoutCollectionService.createCollection(actionCollectionDTO).block();
        ActionCollection createdActionCollection = actionCollectionRepository
                .findByApplicationId(createdApplication.getId(), READ_ACTIONS, null)
                .blockFirst();

        final ActionCollectionMoveDTO actionCollectionMoveDTO = new ActionCollectionMoveDTO();
        actionCollectionMoveDTO.setCollectionId(createdActionCollection.getId());
        actionCollectionMoveDTO.setDestinationPageId(newPageRes.getId());

        final Mono<ActionCollectionDTO> actionCollectionDTOMono =
                layoutCollectionService.moveCollection(actionCollectionMoveDTO);

        StepVerifier.create(actionCollectionDTOMono)
                .assertNext(res -> {
                    assertThat(res.getPageId()).isEqualTo(newPageRes.getId());
                })
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
                .createCollection(actionCollectionDTO)
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

        final ActionCollectionDTO createdActionCollectionDTO1 =
                layoutCollectionService.createCollection(actionCollectionDTO1).block();

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

        final ActionCollectionDTO createdActionCollectionDTO2 =
                layoutCollectionService.createCollection(actionCollectionDTO2).block();

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

        final LayoutDTO layoutDTO =
                refactoringService.refactorEntityName(refactorActionNameDTO).block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getByIdWithoutPermissionCheck(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    assertEquals(
                            "export default { x: testCollection1.newTestAction1() }",
                            actionCollection.getUnpublishedCollection().getBody());
                })
                .verifyComplete();

        final Mono<NewAction> actionMono =
                newActionService.getByIdWithoutPermissionCheck(createdActionCollectionDTO2.getActions().stream()
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

        final ActionCollectionDTO createdActionCollectionDTO1 =
                layoutCollectionService.createCollection(actionCollectionDTO1).block();

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

        final ActionCollectionDTO createdActionCollectionDTO2 =
                layoutCollectionService.createCollection(actionCollectionDTO2).block();

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

        final LayoutDTO layoutDTO =
                refactoringService.refactorEntityName(refactorActionNameDTO).block();

        assert createdActionCollectionDTO2 != null;
        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getByIdWithoutPermissionCheck(createdActionCollectionDTO2.getId());

        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> {
                    assertEquals(
                            "export default { x: Api1.run() }",
                            actionCollection.getUnpublishedCollection().getBody());
                })
                .verifyComplete();

        final Mono<NewAction> actionMono =
                newActionService.getByIdWithoutPermissionCheck(createdActionCollectionDTO2.getActions().stream()
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

        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        applicationPageService.publish(testApp.getId(), true).block();

        actionCollectionDTO.getActions().get(0).getActionConfiguration().setBody("updatedBody");

        ActionCollectionDTO updatedActionCollectionDTO = layoutCollectionService
                .updateUnpublishedActionCollection(createdActionCollectionId, actionCollectionDTO)
                .block();
        assert updatedActionCollectionDTO != null;
        assert updatedActionCollectionDTO.getId() != null;

        final Mono<List<ActionCollectionViewDTO>> viewModeCollectionsMono = actionCollectionService
                .getActionCollectionsForViewMode(testApp.getId(), null)
                .collectList();

        StepVerifier.create(viewModeCollectionsMono)
                .assertNext(viewModeCollections -> {
                    assertThat(viewModeCollections).hasSize(1);

                    final ActionCollectionViewDTO actionCollectionViewDTO = viewModeCollections.get(0);

                    // Actions
                    final List<ActionDTO> actions = actionCollectionViewDTO.getActions();
                    assertThat(actions).hasSize(1);
                    assertThat(actions.get(0).getActionConfiguration().getBody())
                            .isEqualTo("mockBody");

                    // Variables
                    final List<JSValue> variables = actionCollectionViewDTO.getVariables();
                    assertThat(variables).hasSize(1);
                    assertThat(variables.get(0).getValue()).isEqualTo("test");

                    // Metadata
                    assertThat(actionCollectionViewDTO.getId()).isEqualTo(createdActionCollectionId);
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

        final ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
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

    private ActionDTO createAction(String actionName, String body, boolean isValid) {
        ActionDTO testAction = new ActionDTO();
        testAction.setName(actionName);
        testAction.setActionConfiguration(new ActionConfiguration());
        testAction.getActionConfiguration().setBody(body);
        testAction.getActionConfiguration().setIsValid(isValid);
        return testAction;
    }

    private ActionCollectionDTO createActionCollection(String collectionName, String body, PluginType pluginType) {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(collectionName);
        actionCollectionDTO.setPageId(testPage.getId());
        actionCollectionDTO.setApplicationId(testApp.getId());
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody(body);
        actionCollectionDTO.setPluginType(pluginType);
        return actionCollectionDTO;
    }

    private JSONArray createDynamicList(String key, String value) {
        JSONArray temp2 = new JSONArray();
        temp2.add(new JSONObject(Map.of(key, value)));
        return temp2;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testUpdateUnpublishedActionCollection_withValidCollection_callsPageLayoutOnlyOnceAndAssertCyclicDependencyError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO =
                createActionCollection("testCollection1", "collectionBody", PluginType.JS);

        ActionDTO action1 = createAction("testAction1", "initial body", false);
        ActionDTO action2 = createAction("testAction2", "mockBody", false);
        ActionDTO action3 = createAction("testAction3", "mockBody", false);

        actionCollectionDTO.setActions(List.of(action1, action2, action3));

        Layout layout = testPage.getLayouts().get(0);
        ArrayList dslList = (ArrayList) layout.getDsl().get("children");
        JSONObject tableDsl = (JSONObject) dslList.get(0);
        tableDsl.put("tableData", "{{testCollection1.testAction1.data}}");
        tableDsl.put("dynamicBindingPathList", createDynamicList("key", "tableData"));
        tableDsl.put("dynamicPropertyPathList", createDynamicList("key", "tableData"));
        layout.getDsl().put("widgetName", "MainContainer");

        testPage.setLayouts(List.of(layout));
        PageDTO updatedPage =
                newPageService.updatePage(testPage.getId(), testPage).block();

        // Create Js object
        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        // Update JS object to create cyclic dependency
        actionCollectionDTO.getActions().stream()
                .filter(action -> "testAction1".equals(action.getName()))
                .findFirst()
                .ifPresent(action ->
                        action.getActionConfiguration().setBody("function () {\n  return Table1.tableData;\n}"));

        final Mono<ActionCollectionDTO> updatedActionCollectionDTO =
                layoutCollectionService.updateUnpublishedActionCollection(
                        createdActionCollectionId, actionCollectionDTO);

        StepVerifier.create(updatedActionCollectionDTO)
                .assertNext(actionCollectionDTO1 -> {
                    assertEquals(createdActionCollectionId, actionCollectionDTO1.getId());

                    // This invocation will happen here twice, once during create collection and once during update
                    // collection as expected
                    Mockito.verify(updateLayoutService, Mockito.times(2))
                            .updatePageLayoutsByPageId(Mockito.anyString());

                    assertEquals(1, actionCollectionDTO1.getErrorReports().size());
                    assertEquals(
                            AppsmithError.CYCLICAL_DEPENDENCY_ERROR.getAppErrorCode(),
                            actionCollectionDTO1.getErrorReports().get(0).getCode());

                    // Iterate over each action and assert that errorReports is null as action collection already has
                    // error reports
                    // it's not required in each action
                    actionCollectionDTO
                            .getActions()
                            .forEach(action -> assertNull(action.getErrorReports(), "Error reports should be null"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testUpdateUnpublishedActionCollection_createNewActionsWithSameNameAsExisting_returnsDuplicateActionNameError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO =
                createActionCollection("testCollection1", "collectionBody", PluginType.JS);

        ActionDTO action1 = createAction("testAction1", "initial body", false);
        actionCollectionDTO.setActions(List.of(action1));

        // Create Js object
        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        ActionDTO action2 = createAction("testAction1", "mockBody", false);
        ActionDTO action3 = createAction("testAction2", "mockBody", false);

        actionCollectionDTO.setActions(
                List.of(createdActionCollectionDTO.getActions().get(0), action2, action3));

        final Mono<ActionCollectionDTO> updatedActionCollectionDTO =
                layoutCollectionService.updateUnpublishedActionCollection(
                        createdActionCollectionId, actionCollectionDTO);

        StepVerifier.create(updatedActionCollectionDTO).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithException);
            String expectedMessage = "testAction1 already exists. Please use a different name";
            assertEquals(expectedMessage, error.getMessage());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testUpdateUnpublishedActionCollection_createMultipleActionsWithSameName_returnsDuplicateActionNameError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO =
                createActionCollection("testCollection1", "collectionBody", PluginType.JS);
        ActionDTO action1 = createAction("testAction1", "initial body", false);
        actionCollectionDTO.setActions(List.of(action1));

        // Create Js object
        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        // Update JS object to create an action with same name as previously created action
        ActionDTO action2 = createAction("testAction2", "mockBody", false);
        ActionDTO action3 = createAction("testAction2", "mockBody", false);

        actionCollectionDTO.setActions(
                List.of(createdActionCollectionDTO.getActions().get(0), action2, action3));

        final Mono<ActionCollectionDTO> updatedActionCollectionDTO =
                layoutCollectionService.updateUnpublishedActionCollection(
                        createdActionCollectionId, actionCollectionDTO);

        StepVerifier.create(updatedActionCollectionDTO).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithException);
            String expectedMessage = "testAction2 already exists. Please use a different name";
            assertEquals(expectedMessage, error.getMessage());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testLayoutOnLoadActions_withTwoWidgetsAndSameBinding_callsCorrectActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        ActionCollectionDTO actionCollectionDTO =
                createActionCollection("testCollection1", "collectionBody", PluginType.JS);

        // Create actions
        ActionDTO action1 = createAction("myFunction", "return [{\"key\": \"value\"}];", true);
        ActionDTO action2 = createAction("myFunction2", "mockBody", false);

        actionCollectionDTO.setActions(List.of(action1, action2));

        // Create Layout with Table and Text Widgets
        Layout layout = testPage.getLayouts().get(0);
        layout.getDsl().put("widgetName", "MainContainer");
        ArrayList dslList = (ArrayList) layout.getDsl().get("children");
        JSONObject tableDsl = (JSONObject) dslList.get(0);
        tableDsl.put("tableData", "{{testCollection1.myFunction.data}}");
        tableDsl.put("dynamicBindingPathList", createDynamicList("key", "tableData"));
        tableDsl.put("dynamicPropertyPathList", createDynamicList("key", "tableData"));

        JSONObject textDsl = new JSONObject();
        textDsl.put("widgetName", "Text1");
        textDsl.put("type", "TEXT_WIDGET");
        textDsl.put("text", "{{testCollection1.myFunction.data}} + {{testCollection1.myFunction2.data}}");
        textDsl.put("dynamicBindingPathList", createDynamicList("key", "text"));
        textDsl.put("dynamicPropertyPathList", createDynamicList("key", "text"));

        layout.setLayoutOnLoadActions(List.of());

        dslList.add(textDsl);

        testPage.setLayouts(List.of(layout));

        PageDTO updatedPage =
                newPageService.updatePage(testPage.getId(), testPage).block();

        // Create Js object
        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        final Mono<ActionCollectionDTO> updatedActionCollectionDTOMono =
                layoutCollectionService.updateUnpublishedActionCollection(
                        createdActionCollectionId, actionCollectionDTO);

        Mono<PageDTO> pageWithMigratedDSLMono =
                applicationPageService.getPageAndMigrateDslByBranchedPageId(testPage.getId(), false, false);

        StepVerifier.create(updatedActionCollectionDTOMono.zipWhen(actionCollectionDTO1 -> {
                    return pageWithMigratedDSLMono;
                }))
                .assertNext(tuple -> {
                    ActionCollectionDTO actionCollectionDTO1 = tuple.getT1();
                    assertEquals(createdActionCollectionId, actionCollectionDTO1.getId());
                    Mockito.verify(updateLayoutService, Mockito.times(2))
                            .updatePageLayoutsByPageId(Mockito.anyString());
                    actionCollectionDTO1
                            .getActions()
                            .forEach(action -> assertNull(action.getErrorReports(), "Error reports should be null"));

                    PageDTO pageWithMigratedDSL = tuple.getT2();
                    List<Set<DslExecutableDTO>> layoutOnLoadActions =
                            pageWithMigratedDSL.getLayouts().get(0).getLayoutOnLoadActions();
                    List<Set<String>> actualNames = layoutOnLoadActions.stream()
                            .map(set ->
                                    set.stream().map(DslExecutableDTO::getName).collect(Collectors.toSet()))
                            .collect(Collectors.toList());
                    List<Set<String>> expectedNames =
                            List.of(Set.of("testCollection1.myFunction", "testCollection1.myFunction2"));
                    assertEquals(expectedNames, actualNames, "layoutOnLoadActions should contain the expected names");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateUnpublishedActionCollection_createSingleAction_fetchesPageFromDBOnlyOnce() {
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
        actionCollectionDTO.setBody("export default {\n\t\n}");
        actionCollectionDTO.setPluginType(PluginType.JS);

        // Create Js object
        ActionCollectionDTO createdActionCollectionDTO =
                layoutCollectionService.createCollection(actionCollectionDTO).block();
        assert createdActionCollectionDTO != null;
        assert createdActionCollectionDTO.getId() != null;
        String createdActionCollectionId = createdActionCollectionDTO.getId();

        // Update JS object to create an action with same name as previously created action
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        action1.getActionConfiguration().setIsValid(false);

        actionCollectionDTO.setActions(List.of(action1));

        final Mono<ActionCollectionDTO> updatedActionCollectionDTO =
                layoutCollectionService.updateUnpublishedActionCollection(
                        createdActionCollectionId, actionCollectionDTO);

        StepVerifier.create(updatedActionCollectionDTO)
                .assertNext(actionCollectionDTO1 -> {
                    assertEquals(createdActionCollectionId, actionCollectionDTO1.getId());
                    Mockito.verify(layoutActionService, Mockito.times(1))
                            .createAction(
                                    Mockito.any(),
                                    Mockito.argThat(createActionMetaDTO ->
                                            createActionMetaDTO != null && createActionMetaDTO.getNewPage() != null));
                })
                .verifyComplete();
    }
}
