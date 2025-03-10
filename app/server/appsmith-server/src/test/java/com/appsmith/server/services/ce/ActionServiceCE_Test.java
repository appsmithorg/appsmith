package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.CommonConstants.EVALUATION_VERSION;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
@DirtiesContext
public class ActionServiceCE_Test {
    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    LayoutService layoutService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @SpyBean
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    MockDataService mockDataService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @SpyBean
    AstService astService;

    @Autowired
    DatasourceRepository datasourceRepository;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    SessionUserService sessionUserService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String defaultEnvironmentId;

    String branchName;

    @BeforeEach
    public void setup() {

        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ActionServiceCE_Test");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        // Create application and page which will be used by the tests to create actions for.
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());
        testApp = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        final String pageId = testApp.getPages().get(0).getId();

        testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

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

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("actionServiceTest");
        newApp.setGitApplicationMetadata(gitData);
        gitConnectedApp = applicationPageService
                .createApplication(newApp, workspaceId)
                .flatMap(application2 -> {
                    application2.getGitApplicationMetadata().setDefaultApplicationId(application2.getId());
                    return applicationService.save(application2).zipWhen(application1 -> exportService
                            .exportByArtifactIdAndBranchName(
                                    application1.getId(), gitData.getRefName(), ArtifactType.APPLICATION)
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson));
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(tuple -> importService.importArtifactInWorkspaceFromGit(
                        workspaceId, tuple.getT1().getId(), tuple.getT2(), gitData.getRefName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        gitConnectedPage = newPageService
                .findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false)
                .block();

        branchName = gitConnectedApp.getGitApplicationMetadata().getRefName();

        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
    }

    @AfterEach
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
    public void findByIdAndBranchName_forGitConnectedAction_getBranchedAction() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        ActionDTO action = new ActionDTO();
        action.setName("findActionByBranchNameTest");
        action.setPageId(gitConnectedPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action);

        StepVerifier.create(actionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO.getPageId()).isEqualTo(gitConnectedPage.getId());
                    assertThat(actionDTO.getBaseId()).isEqualTo(actionDTO.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionAndCheckPermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);

        StepVerifier.create(Mono.zip(actionMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    ActionDTO createdAction = tuple.getT1();
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();
                    assertThat(createdAction.getUserPermissions()).isNotEmpty();

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

                    assertThat(createdAction.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidAction_forGitConnectedApp_getValidPermissionAndDefaultIds() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitConnectedPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action);

        StepVerifier.create(Mono.zip(actionMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    ActionDTO createdAction = tuple.getT1();
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();
                    assertThat(createdAction.getUserPermissions()).isNotEmpty();
                    assertThat(createdAction.getBaseId()).isEqualTo(createdAction.getId());

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

                    assertThat(createdAction.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMoveAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO newPage = new PageDTO();
        newPage.setName("Destination Page");
        newPage.setApplicationId(testApp.getId());
        PageDTO destinationPage = applicationPageService.createPage(newPage).block();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        Mono<ActionDTO> movedActionMono = createActionMono.flatMap(savedAction -> {
            ActionMoveDTO actionMoveDTO = new ActionMoveDTO();
            actionMoveDTO.setAction(savedAction);
            actionMoveDTO.setDestinationPageId(destinationPage.getId());
            assertThat(savedAction.getUserPermissions()).isNotEmpty();
            return layoutActionService.moveAction(actionMoveDTO);
        });

        StepVerifier.create(Mono.zip(createActionMono, movedActionMono))
                .assertNext(tuple -> {
                    ActionDTO originalAction = tuple.getT1();
                    ActionDTO movedAction = tuple.getT2();

                    assertThat(movedAction.getId()).isEqualTo(originalAction.getId());
                    assertThat(movedAction.getName()).isEqualTo(originalAction.getName());
                    assertThat(movedAction.getPolicies()).containsAll(originalAction.getPolicies());
                    assertThat(movedAction.getPageId()).isEqualTo(destinationPage.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void moveAction_forGitConnectedApp_defaultResourceIdsUpdateSuccess() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO newPage = new PageDTO();
        newPage.setName("Destination Page");
        newPage.setApplicationId(gitConnectedApp.getId());
        PageDTO destinationPage = applicationPageService.createPage(newPage).block();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitConnectedPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono =
                layoutActionService.createSingleAction(action).cache();

        Mono<ActionDTO> movedActionMono = createActionMono.flatMap(savedAction -> {
            ActionMoveDTO actionMoveDTO = new ActionMoveDTO();
            actionMoveDTO.setAction(savedAction);
            actionMoveDTO.setDestinationPageId(destinationPage.getId());
            return layoutActionService.moveAction(actionMoveDTO);
        });

        StepVerifier.create(Mono.zip(createActionMono, movedActionMono))
                .assertNext(tuple -> {
                    ActionDTO originalAction = tuple.getT1();
                    ActionDTO movedAction = tuple.getT2();

                    assertThat(movedAction.getId()).isEqualTo(originalAction.getId());
                    assertThat(movedAction.getName()).isEqualTo(originalAction.getName());
                    assertThat(movedAction.getPolicies()).containsAll(originalAction.getPolicies());
                    assertThat(movedAction.getPageId()).isEqualTo(destinationPage.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionWithJustName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono =
                Mono.just(action).flatMap(action1 -> layoutActionService.createSingleAction(action1, Boolean.FALSE));
        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getIsValid()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidActionNullActionConfiguration() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("randomActionName2");
        action.setPageId(testPage.getId());
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono =
                Mono.just(action).flatMap(action1 -> layoutActionService.createSingleAction(action1, Boolean.FALSE));
        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction.getId()).isNotEmpty();
                    assertThat(createdAction.getName()).isEqualTo(action.getName());
                    assertThat(createdAction.getIsValid()).isFalse();
                    assertThat(createdAction.getInvalids())
                            .contains(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionNullName() {
        ActionDTO action = new ActionDTO();
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);
        Mono<ActionDTO> actionMono =
                Mono.just(action).flatMap(action1 -> layoutActionService.createSingleAction(action1, Boolean.FALSE));
        StepVerifier.create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionNullPageId() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);
        StepVerifier.create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createActionWithBranchName_withNullPageId_throwException() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action);

        StepVerifier.create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PAGE_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreateActionInvalidPageId() {
        ActionDTO action = new ActionDTO();
        action.setName("randomActionName3");
        action.setPageId("invalid page id here");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        Mono<ActionDTO> actionMono =
                Mono.just(action).flatMap(action1 -> layoutActionService.createSingleAction(action1, Boolean.FALSE));
        StepVerifier.create(actionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("page", "invalid page id here")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkActionInViewMode() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String key = "bodyMustacheKey";
        ActionDTO action = new ActionDTO();
        action.setName("actionInViewMode");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setBody("{{" + key + "}}");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO action1 = new ActionDTO();
        action1.setName("actionInViewModeWithoutMustacheKey");
        action1.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        actionConfiguration1.setTimeoutInMillisecond(String.valueOf(20000));
        action1.setActionConfiguration(actionConfiguration1);
        action1.setDatasource(datasource);

        ActionDTO action2 = new ActionDTO();
        action2.setName("actionInViewModeWithoutActionConfiguration");
        action2.setPageId(testPage.getId());
        action2.setDatasource(datasource);

        Mono<List<ActionViewDTO>> actionsListMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .then(layoutActionService.createSingleAction(action1, Boolean.FALSE))
                .then(layoutActionService.createSingleAction(action2, Boolean.FALSE))
                .then(applicationPageService.publish(testPage.getApplicationId(), true))
                .then(newActionService.getActionsForViewMode(testApp.getId()).collectList());

        StepVerifier.create(actionsListMono)
                .assertNext(actionsList -> {
                    assertThat(actionsList.size()).isGreaterThan(0);
                    ActionViewDTO actionViewDTO = actionsList.stream()
                            .filter(dto -> dto.getName().equals(action.getName()))
                            .findFirst()
                            .get();

                    assertThat(actionViewDTO).isNotNull();
                    assertThat(actionViewDTO.getJsonPathKeys()).containsAll(Set.of(key));
                    assertThat(actionViewDTO.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO.getTimeoutInMillisecond()).isEqualTo(DEFAULT_ACTION_EXECUTION_TIMEOUT_MS);

                    ActionViewDTO actionViewDTO1 = actionsList.stream()
                            .filter(dto -> dto.getName().equals(action1.getName()))
                            .findFirst()
                            .get();

                    assertThat(actionViewDTO1).isNotNull();
                    assertThat(actionViewDTO1.getJsonPathKeys()).isNullOrEmpty();
                    assertThat(actionViewDTO1.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO1.getTimeoutInMillisecond()).isEqualTo(20000);

                    ActionViewDTO actionViewDTO2 = actionsList.stream()
                            .filter(dto -> dto.getName().equals(action2.getName()))
                            .findFirst()
                            .get();

                    assertThat(actionViewDTO2).isNotNull();
                    assertThat(actionViewDTO2.getPageId()).isEqualTo(testPage.getId());
                    assertThat(actionViewDTO2.getTimeoutInMillisecond()).isEqualTo(DEFAULT_ACTION_EXECUTION_TIMEOUT_MS);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionInViewMode() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("view-mode-action-test");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setPath("{{mustache}}");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> createActionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);
        Mono<List<ActionViewDTO>> actionViewModeListMono = createActionMono
                // Publish the application before fetching the action in view mode
                .then(applicationPageService.publish(testApp.getId(), true))
                .then(newActionService.getActionsForViewMode(testApp.getId()).collectList());

        StepVerifier.create(actionViewModeListMono)
                .assertNext(actions -> {
                    assertThat(actions.size()).isGreaterThan(0);
                    ActionViewDTO actionViewDTO = actions.get(0);
                    assertThat(actionViewDTO.getId()).isNotNull();
                    assertThat(actionViewDTO.getTimeoutInMillisecond()).isNotNull();
                    assertThat(actionViewDTO.getPageId()).isNotNull();
                    assertThat(actionViewDTO.getConfirmBeforeExecute()).isNotNull();
                    assertThat(actionViewDTO.getJsonPathKeys()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateShouldNotResetUserSetOnLoad() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("updateShouldNotResetUserSetOnLoad Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("updateShouldNotResetUserSetOnLoad");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        Mono<ActionDTO> setExecuteOnLoadMono =
                newActionMono.flatMap(savedAction -> layoutActionService.setExecuteOnLoad(savedAction.getId(), true));

        Mono<ActionDTO> updateActionMono = newActionMono.flatMap(preUpdateAction -> {
            ActionDTO actionUpdate = action;
            actionUpdate.getActionConfiguration().setBody("New Body");
            return layoutActionService
                    .updateSingleAction(preUpdateAction.getId(), actionUpdate)
                    .flatMap(updatedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(updatedAction.getPageId())
                            .thenReturn(updatedAction));
        });

        StepVerifier.create(setExecuteOnLoadMono.then(updateActionMono))
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction.getActionConfiguration().getBody()).isEqualTo("New Body");
                    assertThat(updatedAction.getUserSetOnLoad()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateActionShouldSetUpdatedAtField() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("updateActionShouldSetUpdatedAtField Database");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("updateActionShouldSetUpdatedAtField");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        Mono<ActionDTO> updateActionMono = newActionMono.flatMap(preUpdateAction -> {
            ActionDTO actionUpdate = action;
            actionUpdate.getActionConfiguration().setBody("New Body");
            return layoutActionService
                    .updateSingleAction(preUpdateAction.getId(), actionUpdate)
                    .flatMap(updatedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(updatedAction.getPageId())
                            .thenReturn(updatedAction));
        });

        StepVerifier.create(updateActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction.getUpdatedAt()).isNotNull();
                    assertThat(updatedAction.getActionConfiguration().getBody()).isEqualTo("New Body");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionWithGraphQLDatasourceMoustacheBinding() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("moustacheDatasource");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("graphql-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        datasourceConfiguration.setHeaders(List.of(new Property("key", "{{one.text}}")));

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionOne");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        StepVerifier.create(newActionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO).isNotNull();
                    assertThat(actionDTO.getJsonPathKeys()).hasSize(1);
                    assertThat(actionDTO.getJsonPathKeys()).isEqualTo(Set.of("one.text"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionHasPathKeyEntryWhenActionIsUpdated() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("moustacheDatasource");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");
        datasourceConfiguration.setHeaders(List.of(new Property("key", "{{two.text}}")));

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionOne");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        Mono<ActionDTO> updatedActionMono = newActionMono.flatMap(createdAction -> {
            action.getActionConfiguration().setBody("New Body");
            return layoutActionService.updateSingleAction(createdAction.getId(), action);
        });

        StepVerifier.create(updatedActionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO).isNotNull();
                    assertThat(actionDTO.getActionConfiguration().getBody()).isEqualTo("New Body");
                    assertThat(actionDTO.getJsonPathKeys()).hasSize(1);
                    assertThat(actionDTO.getJsonPathKeys()).isEqualTo(Set.of("two.text"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testActionWithNonAPITypeDatasourceMoustacheBinding() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("moustacheDatasource");
        externalDatasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("postgres-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setHeaders(List.of(new Property("key", "{{one.text}}")));

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("actionOne");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(savedDs);

        Mono<ActionDTO> newActionMono =
                layoutActionService.createSingleAction(action, Boolean.FALSE).cache();

        StepVerifier.create(newActionMono)
                .assertNext(actionDTO -> {
                    assertThat(actionDTO).isNotNull();
                    assertThat(actionDTO.getJsonPathKeys()).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkNewActionAndNewDatasourceAnonymousPermissionInPublicApp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Application testApplication = new Application();
        testApplication.setName("checkNewActionAndNewDatasourceAnonymousPermissionInPublicApp TestApp");

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        Application createdApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        String pageId = createdApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .cache();

        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("After Public Datasource");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("After Public action");
        action.setPageId(pageId);
        action.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration1);

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        Mono<Datasource> datasourceMono = publicAppMono.then(datasourceService.findById(savedDatasource.getId()));

        Mono<NewAction> actionMono = publicAppMono.then(newActionService.findById(savedAction.getId()));

        Mono<PermissionGroup> publicAppPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        User anonymousUser = userService.findByEmail("anonymousUser").block();

        StepVerifier.create(
                        Mono.zip(datasourceMono, actionMono, defaultPermissionGroupsMono, publicAppPermissionGroupMono))
                .assertNext(tuple -> {
                    Datasource datasourceFromDb = tuple.getT1();
                    NewAction actionFromDb = tuple.getT2();
                    List<PermissionGroup> permissionGroups = tuple.getT3();
                    PermissionGroup publicAppPermissionGroup = tuple.getT4();

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

                    Policy manageDatasourcePolicy = Policy.builder()
                            .permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder()
                            .permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder()
                            .permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    publicAppPermissionGroup.getId()))
                            .build();

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
                                    viewerPermissionGroup.getId(),
                                    publicAppPermissionGroup.getId()))
                            .build();

                    // Check that the datasource used in the app contains public execute permission
                    assertThat(datasourceFromDb.getPolicies())
                            .containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(actionFromDb.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                    // Assert that viewerPermissionGroup has been assigned to anonymous user.
                    assertThat(publicAppPermissionGroup.getAssignedToUserIds()).contains(anonymousUser.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testExecuteOnLoadParamOnActionCreateWithDefaultContext() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);
        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    // executeOnLoad is expected to be set to false in case of default context
                    assertThat(createdAction.getExecuteOnLoad()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testExecuteOnLoadParamOnActionCreateWithClonePageContext() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
        CreateActionMetaDTO createActionMetaDTO = new CreateActionMetaDTO();
        createActionMetaDTO.setEventContext(eventContext);
        createActionMetaDTO.setIsJsAction(Boolean.FALSE);
        Mono<ActionDTO> actionMono = layoutActionService.createAction(action, createActionMetaDTO);
        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    // executeOnLoad is expected to be set to false in case of default context
                    assertThat(createdAction.getExecuteOnLoad()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateActionWithOutOfRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("60001");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> newActionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);

        Mono<ActionDTO> updateActionMono = newActionMono.flatMap(preUpdateAction -> {
            ActionDTO actionUpdate = action;
            actionUpdate.getActionConfiguration().setBody("New Body");
            return layoutActionService
                    .updateSingleAction(preUpdateAction.getId(), actionUpdate)
                    .flatMap(updatedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(updatedAction.getPageId())
                            .thenReturn(updatedAction));
        });

        StepVerifier.create(updateActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction.getInvalids().stream()
                                    .anyMatch(errorMsg -> errorMsg.contains(
                                            "'Query timeout' field must be an integer between" + " 0 and 60000")))
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateActionWithValidRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("6000");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> newActionMono = layoutActionService.createSingleAction(action, Boolean.FALSE);

        Mono<ActionDTO> updateActionMono = newActionMono.flatMap(preUpdateAction -> {
            action.getActionConfiguration().setBody("New Body");
            return layoutActionService
                    .updateSingleAction(preUpdateAction.getId(), action)
                    .flatMap(updatedAction -> updateLayoutService
                            .updatePageLayoutsByPageId(updatedAction.getPageId())
                            .thenReturn(updatedAction));
        });

        StepVerifier.create(updateActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction).isNotNull();
                    assertThat(updatedAction.getInvalids().stream()
                                    .anyMatch(errorMsg ->
                                            errorMsg.contains("'Query timeout' field must be an integer between")))
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionWithOutOfRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setTimeoutInMillisecond("60001");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                .map(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction).isNotNull();
                    assertThat(createdAction.getInvalids().stream()
                                    .anyMatch(errorMsg -> errorMsg.contains(
                                            "'Query timeout' field must be an integer between" + " 0 and 60000")))
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateActionWithValidRangeTimeout() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(testPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setTimeoutInMillisecond("6000");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Mono<ActionDTO> actionMono = layoutActionService
                .createSingleAction(action, Boolean.FALSE)
                .flatMap(createdAction -> newActionService.findById(createdAction.getId(), READ_ACTIONS))
                .map(newAction -> newActionService.generateActionByViewMode(newAction, false));

        StepVerifier.create(actionMono)
                .assertNext(createdAction -> {
                    assertThat(createdAction).isNotNull();
                    assertThat(createdAction.getInvalids().stream()
                                    .anyMatch(errorMsg ->
                                            errorMsg.contains("'Query timeout' field must be an integer between")))
                            .isFalse();
                })
                .verifyComplete();
    }

    private Mono<PageDTO> createPage(Application app, PageDTO page) {
        return newPageService
                .findByNameAndViewMode(page.getName(), AclPermission.READ_PAGES, false)
                .switchIfEmpty(applicationPageService
                        .createApplication(app, workspaceId)
                        .map(application -> {
                            page.setApplicationId(application.getId());
                            return page;
                        })
                        .flatMap(applicationPageService::createPage));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getActionsExecuteOnLoadPaginatedApi() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("ActionsExecuteOnLoad Paginated Api Test Page");

        Application app = new Application();
        app.setName("newApplication-paginated-api-execute-on-load-Test");

        Mono<PageDTO> pageMono = createPage(app, testPage).cache();

        Mono<LayoutDTO> testMono = pageMono.flatMap(page1 -> {
                    List<Mono<ActionDTO>> monos = new ArrayList<>();

                    ActionDTO action = new ActionDTO();
                    action.setName("paginatedApi");
                    action.setActionConfiguration(new ActionConfiguration());
                    action.getActionConfiguration().setHttpMethod(HttpMethod.POST);
                    action.getActionConfiguration().setPaginationType(PaginationType.URL);
                    action.getActionConfiguration().setNext("{{paginatedApi.data.next}}");
                    action.getActionConfiguration().setPrev("{{paginatedApi.data.prev}}");
                    action.setPageId(page1.getId());
                    action.setDatasource(datasource);
                    action.setDynamicBindingPathList(List.of(new Property("next", null), new Property("prev", null)));
                    monos.add(layoutActionService.createSingleAction(action, Boolean.FALSE));

                    return Mono.zip(monos, objects -> page1);
                })
                .flatMap(page1 -> {
                    final Layout layout = page1.getLayouts().get(0);

                    Layout newLayout = new Layout();

                    JSONObject obj = new JSONObject(Map.of(
                            "widgetName", "testWidget",
                            "key", "value-updated",
                            "bindingPath", "{{paginatedApi.data}}"));
                    JSONArray dynamicBindingsPathList = new JSONArray();
                    dynamicBindingsPathList.add(new JSONObject(Map.of("key", "bindingPath")));

                    obj.put("dynamicBindingPathList", dynamicBindingsPathList);
                    newLayout.setDsl(obj);

                    return updateLayoutService.updateLayout(
                            page1.getId(), page1.getApplicationId(), layout.getId(), newLayout);
                });

        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(
                        List.of("paginatedApi.data"), EVALUATION_VERSION))
                .thenReturn(Flux.just(Tuples.of("paginatedApi.data", new HashSet<>(Set.of("paginatedApi.data")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(
                        List.of("paginatedApi.data.prev"), EVALUATION_VERSION))
                .thenReturn(Flux.just(
                        Tuples.of("paginatedApi.data.prev", new HashSet<>(Set.of("paginatedApi.data.prev")))));
        Mockito.when(astService.getPossibleReferencesFromDynamicBinding(
                        List.of("paginatedApi.data.next"), EVALUATION_VERSION))
                .thenReturn(Flux.just(
                        Tuples.of("paginatedApi.data.next", new HashSet<>(Set.of("paginatedApi.data.next")))));

        StepVerifier.create(testMono)
                .assertNext(layout -> {
                    assertThat(layout).isNotNull();
                    assertThat(layout.getId()).isNotNull();
                    assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                    assertThat(layout.getLayoutOnLoadActions().get(0)).hasSize(1);

                    Set<String> firstSetPageLoadActions = Set.of("paginatedApi");

                    assertThat(layout.getLayoutOnLoadActions().get(0).stream()
                                    .map(DslExecutableDTO::getName)
                                    .collect(Collectors.toSet()))
                            .hasSameElementsAs(firstSetPageLoadActions);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void validateAndSaveActionToRepository_noDatasourceEditPermission() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionExecute");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        NewAction newAction = newActionService.findById(createdAction.getId()).block();

        Set<Policy> datasourceExistingPolicies = datasource.getPolicies();
        datasource.setPolicies(Set.of());
        Datasource updatedDatasource = datasourceRepository.save(datasource).block();
        ActionDTO savedAction =
                newActionService.validateAndSaveActionToRepository(newAction).block();
        assertThat(savedAction.getIsValid()).isTrue();
        datasource.setPolicies(datasourceExistingPolicies);
        datasource = datasourceRepository.save(datasource).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void validateAndSaveActionToRepository_ActionDTOHasCreatedAtUpdatedAtFieldsPresent() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.POST);
        actionConfiguration.setBody("random-request-body");
        actionConfiguration.setHeaders(List.of(new Property("random-header-key", "random-header-value")));
        action.setActionConfiguration(actionConfiguration);
        action.setPageId(testPage.getId());
        action.setName("testActionFields");
        action.setDatasource(datasource);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        NewAction newAction = newActionService.findById(createdAction.getId()).block();
        ActionDTO savedAction =
                newActionService.validateAndSaveActionToRepository(newAction).block();
        assertThat(savedAction.getIsValid()).isTrue();
        assertThat(savedAction.getCreatedAt()).isNotNull();
        assertThat(savedAction.getUpdatedAt()).isNotNull();
    }
}
