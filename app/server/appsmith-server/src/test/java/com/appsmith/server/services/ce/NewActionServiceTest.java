package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;

@SpringBootTest
public class NewActionServiceTest {

    @Autowired
    NewActionService newActionService;

    @Autowired
    PolicyGenerator policyGenerator;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    ActionPermission actionPermission;

    @Autowired
    DatasourcePermission datasourcePermission;

    @Autowired
    DatasourceRepository datasourceRepository;

    @Autowired
    UserRepository userRepository;

    @MockitoSpyBean
    PluginService pluginService;

    @MockitoSpyBean
    DatasourceService datasourceService;

    @MockitoSpyBean
    PermissionGroupService permissionGroupService;

    @MockitoSpyBean
    ApplicationService applicationService;

    @MockitoSpyBean
    PolicySolution policySolution;

    @BeforeEach
    public void setup() {
        Mockito.reset(pluginService, datasourceService, permissionGroupService, applicationService, policySolution);
    }

    private NewAction createActionObject(String actionName, String applicationId, AclPermission permission) {
        Set<String> permissionGroupIds = permissionGroupRepository.findAll().collectList().block().stream()
                .map(PermissionGroup::getId)
                .collect(Collectors.toSet());

        Policy testPolicy = Policy.builder()
                .permissionGroups(permissionGroupIds)
                .permission(permission.getValue())
                .build();

        NewAction newAction = new NewAction();
        newAction.setPolicies(Set.of(testPolicy));
        newAction.setApplicationId(applicationId);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(actionName);
        actionDTO.setPageId(UUID.randomUUID().toString());

        newAction.setUnpublishedAction(actionDTO);
        newAction.setPublishedAction(new ActionDTO());
        return newAction;
    }

    private NewAction createImportAction(
            String name, String applicationId, Datasource datasource, Set<Policy> policies) {
        NewAction newAction = new NewAction();
        newAction.setApplicationId(applicationId);
        newAction.setWorkspaceId(datasource.getWorkspaceId());
        newAction.setPluginId(datasource.getPluginId());
        newAction.setPluginType(PluginType.DB);
        newAction.setPolicies(policies);

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(name);
        actionDTO.setPageId(UUID.randomUUID().toString());
        actionDTO.setDatasource(datasource);
        actionDTO.setActionConfiguration(new ActionConfiguration());

        newAction.setUnpublishedAction(actionDTO);
        return newAction;
    }

    private Datasource createDatasource(String datasourceId, String pluginId) {
        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);
        datasource.setName("Datasource " + datasourceId);
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(UUID.randomUUID().toString());
        datasource.setPolicies(Set.of());
        datasource.setIsAutoGenerated(false);
        return datasource;
    }

    private Plugin createPlugin(String pluginId) {
        Plugin plugin = new Plugin();
        plugin.setId(pluginId);
        plugin.setName("Test Plugin");
        plugin.setType(PluginType.DB);
        return plugin;
    }

    private PermissionGroup createPermissionGroup(String id) {
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setId(id);
        return permissionGroup;
    }

    private Policy createPolicy(AclPermission permission, String permissionGroupId) {
        return Policy.builder()
                .permission(permission.getValue())
                .permissionGroups(Set.of(permissionGroupId))
                .build();
    }

    /**
     * This test is to check whether publish action method publishes the actions if
     * the user has required permission on that object.
     */
    @Test
    @WithUserDetails("api_user")
    public void testActionsPublishedWhenPermissionIsMatched() {
        String applicationId = UUID.randomUUID().toString();

        // create 3 actions with same application id but 2 with edit permission and 1 with read permission
        List<NewAction> actionWithEditPermission = List.of(
                createActionObject("Action1", applicationId, actionPermission.getEditPermission()),
                createActionObject("Action2", applicationId, actionPermission.getReadPermission()),
                createActionObject("Action3", applicationId, actionPermission.getEditPermission()));

        Mono<List<NewAction>> actionListMono = newActionRepository
                .saveAll(actionWithEditPermission)
                .then(newActionService.publishActions(applicationId, actionPermission.getEditPermission()))
                .thenMany(newActionRepository.findByApplicationId(applicationId))
                .collectList();

        StepVerifier.create(actionListMono)
                .assertNext(actions -> {
                    assertThat(actions).hasSize(3);
                    actions.forEach(action -> {
                        assertThat(action.getPublishedAction()).isNotNull();
                        // we've set name and pageId so these fields should not be null in edit mode
                        assertThat(action.getUnpublishedAction()).isNotNull();
                        assertThat(action.getUnpublishedAction().getName()).isNotNull();
                        assertThat(action.getUnpublishedAction().getPageId()).isNotNull();

                        if (action.getUnpublishedAction().getName().equals("Action2")) {
                            // this action should not be published as user has only read permission
                            assertThat(action.getPublishedAction().getName()).isNull();
                            assertThat(action.getPublishedAction().getPageId()).isNull();
                        } else {
                            // it should be published so published mode will contain the same name and pageId
                            assertThat(action.getUnpublishedAction().getName())
                                    .isEqualTo(action.getPublishedAction().getName());
                            assertThat(action.getUnpublishedAction().getPageId())
                                    .isEqualTo(action.getPublishedAction().getPageId());
                        }
                    });
                })
                .verifyComplete();
    }

    @Test
    public void validateActionsBeforeImport_validatesFreshAndExistingActionsTogether_returnsSplitLists() {
        String pluginId = "plugin-id";
        String datasourceId = "datasource-id";
        Datasource datasource = createDatasource(datasourceId, pluginId);
        Plugin plugin = createPlugin(pluginId);
        PermissionGroup publicPermissionGroup = createPermissionGroup("public-permission-group-id");

        Mockito.doReturn(Mono.just(plugin)).when(pluginService).findById(pluginId);
        Mockito.doReturn(Mono.just(publicPermissionGroup))
                .when(permissionGroupService)
                .getPublicPermissionGroup();
        Mockito.doReturn(Mono.just(Set.of(new MustacheBindingToken("Datasource.value", 0, false))))
                .when(datasourceService)
                .extractKeysFromDatasource(any(Datasource.class));

        NewAction freshAction1 = createImportAction("FreshAction1", "application-id", datasource, Set.of());
        NewAction freshAction2 = createImportAction("FreshAction2", "application-id", datasource, Set.of());
        NewAction existingAction = createImportAction("ExistingAction", "application-id", datasource, Set.of());

        Mono<Tuple2<List<NewAction>, List<NewAction>>> resultMono = newActionService.validateActionsBeforeImport(
                null, List.of(freshAction1, freshAction2), List.of(existingAction));

        StepVerifier.create(resultMono)
                .assertNext(validatedActions -> {
                    assertThat(validatedActions.getT1()).hasSize(2);
                    assertThat(validatedActions.getT2()).hasSize(1);

                    List<NewAction> allValidatedActions = List.of(
                            validatedActions.getT1().get(0),
                            validatedActions.getT1().get(1),
                            validatedActions.getT2().get(0));

                    allValidatedActions.forEach(action -> {
                        ActionDTO actionDTO = action.getUnpublishedAction();
                        assertThat(actionDTO.getPluginName()).isEqualTo(plugin.getName());
                        assertThat(actionDTO.getJsonPathKeys()).contains("Datasource.value");
                        assertThat(actionDTO.getDatasource().getId()).isEqualTo(datasourceId);
                        assertThat(actionDTO.getDatasource().getPluginId()).isEqualTo(pluginId);
                    });
                })
                .verifyComplete();

        Mockito.verify(pluginService, times(1)).findById(pluginId);
        Mockito.verify(datasourceService, times(1)).extractKeysFromDatasource(any(Datasource.class));
        Mockito.verify(permissionGroupService, times(1)).getPublicPermissionGroup();
    }

    @Test
    public void validateActionsBeforeImport_updatesPublicDatasourcePolicyOnceForSharedDatasource() {
        String pluginId = "plugin-id";
        String datasourceId = "datasource-id";
        String applicationId = "application-id";
        String publicPermissionGroupId = "public-permission-group-id";
        Datasource datasource = createDatasource(datasourceId, pluginId);
        Plugin plugin = createPlugin(pluginId);
        PermissionGroup publicPermissionGroup = createPermissionGroup(publicPermissionGroupId);
        Application application = new Application();
        application.setId(applicationId);
        application.setIsPublic(true);

        Set<Policy> publicActionPolicies =
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId));

        Mockito.doReturn(Mono.just(plugin)).when(pluginService).findById(pluginId);
        Mockito.doReturn(Mono.just(publicPermissionGroup))
                .when(permissionGroupService)
                .getPublicPermissionGroup();
        Mockito.doReturn(Mono.just(Set.of())).when(datasourceService).extractKeysFromDatasource(any(Datasource.class));
        Mockito.doReturn(Mono.just(application)).when(applicationService).findById(applicationId);
        Mockito.doReturn(Flux.just(datasource))
                .when(datasourceService)
                .findAllByIds(eq(List.of(datasourceId)), any(AclPermission.class));
        Mockito.doAnswer(invocation -> Mono.just(invocation.getArgument(0)))
                .when(datasourceService)
                .save(any(Datasource.class), eq(false));

        NewAction publicAction1 = createImportAction("PublicAction1", applicationId, datasource, publicActionPolicies);
        NewAction publicAction2 = createImportAction("PublicAction2", applicationId, datasource, publicActionPolicies);

        StepVerifier.create(newActionService.validateActionsBeforeImport(
                        null, List.of(publicAction1, publicAction2), List.of()))
                .assertNext(validatedActions -> {
                    assertThat(validatedActions.getT1()).hasSize(2);
                    assertThat(validatedActions.getT2()).isEmpty();
                })
                .verifyComplete();

        Mockito.verify(permissionGroupService, times(1)).getPublicPermissionGroup();
        Mockito.verify(applicationService, times(1)).findById(applicationId);
        Mockito.verify(datasourceService, times(1)).findAllByIds(eq(List.of(datasourceId)), any(AclPermission.class));
        Mockito.verify(datasourceService, times(1)).save(any(Datasource.class), eq(false));
    }

    @Test
    public void validateActionsBeforeImport_skipsPublicDatasourceUpdateWhenApplicationIdMissing() {
        String pluginId = "plugin-id";
        String datasourceId = "datasource-id";
        String publicPermissionGroupId = "public-permission-group-id";
        Datasource datasource = createDatasource(datasourceId, pluginId);
        Plugin plugin = createPlugin(pluginId);
        PermissionGroup publicPermissionGroup = createPermissionGroup(publicPermissionGroupId);
        Set<Policy> publicActionPolicies =
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId));

        Mockito.doReturn(Mono.just(plugin)).when(pluginService).findById(pluginId);
        Mockito.doReturn(Mono.just(publicPermissionGroup))
                .when(permissionGroupService)
                .getPublicPermissionGroup();
        Mockito.doReturn(Mono.just(Set.of())).when(datasourceService).extractKeysFromDatasource(any(Datasource.class));

        NewAction publicActionWithoutApplication =
                createImportAction("PublicActionWithoutApplication", null, datasource, publicActionPolicies);

        StepVerifier.create(newActionService.validateActionsBeforeImport(
                        null, List.of(publicActionWithoutApplication), List.of()))
                .assertNext(validatedActions -> {
                    assertThat(validatedActions.getT1()).hasSize(1);
                    assertThat(validatedActions.getT2()).isEmpty();
                })
                .verifyComplete();

        Mockito.verify(applicationService, times(0)).findById(any(String.class));
        Mockito.verify(datasourceService, times(0)).save(any(Datasource.class), eq(false));
    }

    /**
     * Saves a datasource whose only policies grant the given permissions to every permission group of api_user.
     */
    private Datasource saveDatasourceGrantingApiUser(String pluginId, Set<AclPermission> permissions) {
        User apiUser = userRepository.findByEmail("api_user").block();
        Set<String> apiUserPermissionGroupIds = permissionGroupRepository
                .getAllPermissionGroupsIdsForUser(apiUser)
                .block();

        Map<String, Policy> policyMap = new HashMap<>();
        permissions.forEach(permission -> policyMap.put(
                permission.getValue(),
                Policy.builder()
                        .permission(permission.getValue())
                        .permissionGroups(Set.copyOf(apiUserPermissionGroupIds))
                        .build()));

        Datasource datasource = new Datasource();
        datasource.setName("Datasource " + UUID.randomUUID());
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(UUID.randomUUID().toString());
        datasource.setPolicyMap(policyMap);
        Datasource savedDatasource = datasourceRepository.save(datasource).block();
        savedDatasource.setIsAutoGenerated(false);
        return savedDatasource;
    }

    private boolean isExecutableByPublicPermissionGroup(String datasourceId, String publicPermissionGroupId) {
        Datasource storedDatasource =
                datasourceRepository.findById(datasourceId).block();
        Policy executePolicy = storedDatasource.getPolicyMap().get(AclPermission.EXECUTE_DATASOURCES.getValue());
        return executePolicy != null && executePolicy.getPermissionGroups().contains(publicPermissionGroupId);
    }

    private void stubPublicImportDependencies(String applicationId, Plugin plugin) {
        Application application = new Application();
        application.setId(applicationId);
        application.setIsPublic(true);

        Mockito.doReturn(Mono.just(plugin)).when(pluginService).findById(plugin.getId());
        Mockito.doReturn(Mono.just(Set.of())).when(datasourceService).extractKeysFromDatasource(any(Datasource.class));
        Mockito.doReturn(Mono.just(application)).when(applicationService).findById(applicationId);
    }

    @Test
    @WithUserDetails("api_user")
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_rejectPublicDatasourcePolicyUpdate_when_callerCannotCreateActionsOnDatasource() {
        // Given
        String applicationId = UUID.randomUUID().toString();
        Plugin plugin = createPlugin(UUID.randomUUID().toString());
        stubPublicImportDependencies(applicationId, plugin);
        Datasource viewOnlyDatasource =
                saveDatasourceGrantingApiUser(plugin.getId(), Set.of(AclPermission.READ_DATASOURCES));
        String publicPermissionGroupId =
                permissionGroupService.getPublicPermissionGroup().block().getId();
        NewAction publicAction = createImportAction(
                "PublicAction",
                applicationId,
                viewOnlyDatasource,
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId)));

        // When
        Mono<Tuple2<List<NewAction>, List<NewAction>>> result =
                newActionService.validateActionsBeforeImport(null, List.of(publicAction), List.of());

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND);
                })
                .verify();
        assertThat(isExecutableByPublicPermissionGroup(viewOnlyDatasource.getId(), publicPermissionGroupId))
                .isFalse();
    }

    @Test
    @WithUserDetails("api_user")
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_addPublicDatasourcePolicy_when_callerCanCreateActionsOnDatasource() {
        // Given
        String applicationId = UUID.randomUUID().toString();
        Plugin plugin = createPlugin(UUID.randomUUID().toString());
        stubPublicImportDependencies(applicationId, plugin);
        AclPermission actionCreatePermission =
                datasourcePermission.getActionCreatePermission().block();
        Datasource datasource = saveDatasourceGrantingApiUser(
                plugin.getId(), Set.of(AclPermission.READ_DATASOURCES, actionCreatePermission));
        String publicPermissionGroupId =
                permissionGroupService.getPublicPermissionGroup().block().getId();
        NewAction publicAction = createImportAction(
                "PublicAction",
                applicationId,
                datasource,
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId)));

        // When
        Mono<Tuple2<List<NewAction>, List<NewAction>>> result =
                newActionService.validateActionsBeforeImport(null, List.of(publicAction), List.of());

        // Then
        StepVerifier.create(result)
                .assertNext(
                        validatedActions -> assertThat(validatedActions.getT1()).hasSize(1))
                .verifyComplete();
        assertThat(isExecutableByPublicPermissionGroup(datasource.getId(), publicPermissionGroupId))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_rejectPublicDatasourcePolicyUpdate_when_dryValidationCallerCannotCreateActionsOnDatasource() {
        // Given
        String applicationId = UUID.randomUUID().toString();
        Plugin plugin = createPlugin(UUID.randomUUID().toString());
        stubPublicImportDependencies(applicationId, plugin);
        Datasource viewOnlyDatasource =
                saveDatasourceGrantingApiUser(plugin.getId(), Set.of(AclPermission.READ_DATASOURCES));
        String publicPermissionGroupId =
                permissionGroupService.getPublicPermissionGroup().block().getId();
        NewAction publicAction = createImportAction(
                "PublicAction",
                applicationId,
                viewOnlyDatasource,
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId)));

        // When
        Mono<NewAction> result = newActionService.validateAction(publicAction, true);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.NO_RESOURCE_FOUND);
                })
                .verify();
        assertThat(isExecutableByPublicPermissionGroup(viewOnlyDatasource.getId(), publicPermissionGroupId))
                .isFalse();
    }

    @Test
    @WithUserDetails("api_user")
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_validateDryAction_when_actionIsNotPublicAndCallerCanOnlyReadDatasource() {
        // Given
        String applicationId = UUID.randomUUID().toString();
        Plugin plugin = createPlugin(UUID.randomUUID().toString());
        stubPublicImportDependencies(applicationId, plugin);
        Datasource viewOnlyDatasource =
                saveDatasourceGrantingApiUser(plugin.getId(), Set.of(AclPermission.READ_DATASOURCES));
        NewAction privateAction = createImportAction("PrivateAction", applicationId, viewOnlyDatasource, Set.of());

        // When
        Mono<NewAction> result = newActionService.validateAction(privateAction, true);

        // Then
        StepVerifier.create(result)
                .assertNext(validatedAction -> assertThat(validatedAction
                                .getUnpublishedAction()
                                .getDatasource()
                                .getId())
                        .isEqualTo(viewOnlyDatasource.getId()))
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_validateImportedActions_when_actionsAreNotPublicAndCallerCanOnlyReadDatasource() {
        // Given
        String applicationId = UUID.randomUUID().toString();
        Plugin plugin = createPlugin(UUID.randomUUID().toString());
        stubPublicImportDependencies(applicationId, plugin);
        Datasource viewOnlyDatasource =
                saveDatasourceGrantingApiUser(plugin.getId(), Set.of(AclPermission.READ_DATASOURCES));
        NewAction privateAction = createImportAction("PrivateAction", applicationId, viewOnlyDatasource, Set.of());

        // When
        Mono<Tuple2<List<NewAction>, List<NewAction>>> result =
                newActionService.validateActionsBeforeImport(null, List.of(privateAction), List.of());

        // Then
        StepVerifier.create(result)
                .assertNext(
                        validatedActions -> assertThat(validatedActions.getT1()).hasSize(1))
                .verifyComplete();
        Mockito.verify(datasourceService, times(0)).findAllByIds(any(), any(AclPermission.class));
    }

    @Test
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_authorizeAllPublicDatasourceCandidatesInOneLookup_when_importReferencesSeveralDatasources() {
        // Given
        String pluginId = "plugin-id";
        String applicationId = "application-id";
        String publicPermissionGroupId = "public-permission-group-id";
        Datasource firstDatasource = createDatasource("first-datasource-id", pluginId);
        Datasource secondDatasource = createDatasource("second-datasource-id", pluginId);
        Application application = new Application();
        application.setId(applicationId);
        application.setIsPublic(true);
        Set<Policy> publicActionPolicies =
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId));

        Mockito.doReturn(Mono.just(createPlugin(pluginId))).when(pluginService).findById(pluginId);
        Mockito.doReturn(Mono.just(createPermissionGroup(publicPermissionGroupId)))
                .when(permissionGroupService)
                .getPublicPermissionGroup();
        Mockito.doReturn(Mono.just(Set.of())).when(datasourceService).extractKeysFromDatasource(any(Datasource.class));
        Mockito.doReturn(Mono.just(application)).when(applicationService).findById(applicationId);
        Mockito.doReturn(Flux.just(firstDatasource, secondDatasource))
                .when(datasourceService)
                .findAllByIds(any(), any(AclPermission.class));
        Mockito.doAnswer(invocation -> Mono.just(invocation.getArgument(0)))
                .when(datasourceService)
                .save(any(Datasource.class), eq(false));

        List<NewAction> publicActions = List.of(
                createImportAction("FirstAction", applicationId, firstDatasource, publicActionPolicies),
                createImportAction("SecondAction", applicationId, secondDatasource, publicActionPolicies),
                createImportAction("ThirdAction", applicationId, secondDatasource, publicActionPolicies));

        // When
        Mono<Tuple2<List<NewAction>, List<NewAction>>> result =
                newActionService.validateActionsBeforeImport(null, publicActions, List.of());

        // Then
        StepVerifier.create(result)
                .assertNext(
                        validatedActions -> assertThat(validatedActions.getT1()).hasSize(3))
                .verifyComplete();
        Mockito.verify(datasourceService, times(1))
                .findAllByIds(
                        Mockito.argThat(ids -> ids.size() == 2
                                && Set.copyOf(ids).equals(Set.of("first-datasource-id", "second-datasource-id"))),
                        any(AclPermission.class));
        Mockito.verify(datasourceService, times(2)).save(any(Datasource.class), eq(false));
    }

    @Test
    @DisplayName("GHSA-rx37-m7qm-4hrh")
    void should_rejectWholeBatchBeforeAnySave_when_oneOfSeveralPublicDatasourceCandidatesIsUnauthorized() {
        // Given
        String pluginId = "plugin-id";
        String applicationId = "application-id";
        String publicPermissionGroupId = "public-permission-group-id";
        Datasource authorizedDatasource = createDatasource("authorized-datasource-id", pluginId);
        Datasource unauthorizedDatasource = createDatasource("unauthorized-datasource-id", pluginId);
        Application application = new Application();
        application.setId(applicationId);
        application.setIsPublic(true);
        Set<Policy> publicActionPolicies =
                Set.of(createPolicy(actionPermission.getExecutePermission(), publicPermissionGroupId));

        Mockito.doReturn(Mono.just(createPlugin(pluginId))).when(pluginService).findById(pluginId);
        Mockito.doReturn(Mono.just(createPermissionGroup(publicPermissionGroupId)))
                .when(permissionGroupService)
                .getPublicPermissionGroup();
        Mockito.doReturn(Mono.just(Set.of())).when(datasourceService).extractKeysFromDatasource(any(Datasource.class));
        Mockito.doReturn(Mono.just(application)).when(applicationService).findById(applicationId);
        Mockito.doReturn(Flux.just(authorizedDatasource))
                .when(datasourceService)
                .findAllByIds(any(), any(AclPermission.class));

        List<NewAction> publicActions = List.of(
                createImportAction("AuthorizedAction", applicationId, authorizedDatasource, publicActionPolicies),
                createImportAction("UnauthorizedAction", applicationId, unauthorizedDatasource, publicActionPolicies));

        // When
        Mono<Tuple2<List<NewAction>, List<NewAction>>> result =
                newActionService.validateActionsBeforeImport(null, publicActions, List.of());

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND);
                    assertThat(error.getMessage()).contains("unauthorized-datasource-id");
                })
                .verify();
        Mockito.verify(datasourceService, times(0)).save(any(Datasource.class), eq(false));
    }
}
