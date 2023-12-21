package com.appsmith.server.workflows.interact;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.helpers.WorkflowHelper;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.models.CreatorContextType.WORKFLOW;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXPORT_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_HISTORY_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKFLOW_CREATE_ACTIONS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class InteractWorkflowServiceTest {

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CrudWorkflowService crudWorkflowService;

    @Autowired
    private InteractWorkflowService interactWorkflowService;

    @Autowired
    WorkflowHelper workflowHelper;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    ApiKeyRepository apiKeyRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    WorkflowRepository workflowRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    private PluginExecutor pluginExecutor;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private CrudWorkflowEntityService crudWorkflowEntityService;

    @Autowired
    private NewActionRepository newActionRepository;

    @Autowired
    private ActionCollectionRepository actionCollectionRepository;

    @SpyBean
    private WorkflowProxyHelper workflowProxyHelper;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private LayoutActionService layoutActionService;

    private Workspace workspace;
    private Workflow workflow;
    private Datasource datasource;
    private String jsPluginId;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        User apiUser = userRepository.findByCaseInsensitiveEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(
                FeatureFlagEnum.license_gac_enabled.name(),
                TRUE,
                FeatureFlagEnum.release_workflows_enabled.name(),
                TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace1 = new Workspace();
        workspace1.setName("Workspace - InteractWorkflowServiceTest");
        workspace = workspaceService.create(workspace1).block();

        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Workflow toCreateWorkflow = new Workflow();
        toCreateWorkflow.setName("Workflow - InteractWorkflowServiceTest");
        workflow = crudWorkflowService
                .createWorkflow(toCreateWorkflow, workspace.getId())
                .block();

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Datasource - InteractWorkflowServiceTest");
        externalDatasource.setWorkspaceId(workspace.getId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        datasource = datasourceService.create(externalDatasource).block();

        jsPluginId = pluginRepository
                .findByPackageName("installed-js-plugin")
                .map(Plugin::getId)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGenerateBearerTokenForWebhook() {
        String testName = "testGenerateBearerTokenForWebhook";
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName(testName);
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(testName);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setContextType(WORKFLOW);
        ActionDTO action1 = new ActionDTO();
        action1.setName(testName);
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody(testName);
        actionCollectionDTO.setActions(List.of(action1));

        ActionCollectionDTO workflowActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        String workflowBearerToken = interactWorkflowService
                .generateBearerTokenForWebhook(workflow.getId())
                .block();
        String userEmail = workflowHelper.generateWorkflowBotUserEmail(workflow).toLowerCase();
        User workflowBotUser =
                userRepository.findByCaseInsensitiveEmail(userEmail).block();
        assertThat(workflowBotUser).isNotNull();
        List<PermissionGroup> workflowBotRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workflow.getId(), Workflow.class.getSimpleName())
                .collectList()
                .block();
        assertThat(workflowBotRoles).hasSize(1);
        PermissionGroup workflowBotRole = workflowBotRoles.get(0);
        assertThat(workflowBotRole.getName()).isEqualTo(workflowHelper.generateWorkflowBotRoleName(workflow));
        assertThat(workflowBotRole.getAssignedToUserIds()).containsOnly(workflowBotUser.getId());

        String actualWorkflowBearerToken = Arrays.stream(
                        encryptionService.decryptString(workflowBearerToken).split(FieldName.APIKEY_USERID_DELIMITER))
                .toList()
                .get(0);

        List<UserApiKey> userApiKeys = apiKeyRepository
                .getByUserIdWithoutPermission(workflowBotUser.getId())
                .collectList()
                .block();
        assertThat(userApiKeys).hasSize(1);
        assertThat(userApiKeys.get(0).getApiKey()).isEqualTo(actualWorkflowBearerToken);

        Workflow workflowFromDB = workflowRepository.findById(workflow.getId()).block();
        workflowFromDB.getPolicies().forEach(policy -> {
            if (MANAGE_WORKFLOWS.getValue().equals(policy.getPermission())
                    || READ_WORKFLOWS.getValue().equals(policy.getPermission())
                    || PUBLISH_WORKFLOWS.getValue().equals(policy.getPermission())
                    || DELETE_WORKFLOWS.getValue().equals(policy.getPermission())
                    || EXPORT_WORKFLOWS.getValue().equals(policy.getPermission())
                    || WORKFLOW_CREATE_ACTIONS.getValue().equals(policy.getPermission())
                    || READ_HISTORY_WORKFLOWS.getValue().equals(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
            } else if (EXECUTE_WORKFLOWS.getValue().equals(policy.getPermission())) {
                assertThat(policy.getPermissionGroups().contains(workflowBotRole.getId()));
            }
        });

        NewAction workflowActionFromDb =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        workflowActionFromDb.getPolicies().forEach(policy -> {
            if (EXECUTE_ACTIONS.getValue().equals(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(workflowBotRole.getId());
            } else {
                assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
            }
        });

        ActionCollection workflowActionCollectionFromDb = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();
        workflowActionCollectionFromDb.getPolicies().forEach(policy -> {
            if (EXECUTE_ACTIONS.getValue().equals(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(workflowBotRole.getId());
            } else {
                assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
            }
        });

        assertThat(workflowActionCollectionFromDb.getUnpublishedCollection().getDefaultToBranchedActionIdsMap())
                .hasSize(1);

        workflowActionCollectionFromDb
                .getUnpublishedCollection()
                .getDefaultToBranchedActionIdsMap()
                .forEach((key, value) -> {
                    NewAction jsActionInsideWorkflowActionCollectionFromDb =
                            newActionRepository.findById(key).block();
                    jsActionInsideWorkflowActionCollectionFromDb.getPolicies().forEach(policy -> {
                        if (EXECUTE_ACTIONS.getValue().equals(policy.getPermission())) {
                            assertThat(policy.getPermissionGroups()).contains(workflowBotRole.getId());
                        } else {
                            assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
                        }
                    });
                });

        ActionCollection mainWorkflowActionCollectionFromDb = actionCollectionRepository
                .findById(workflow.getMainJsObjectId())
                .block();
        mainWorkflowActionCollectionFromDb.getPolicies().forEach(policy -> {
            if (EXECUTE_ACTIONS.getValue().equals(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(workflowBotRole.getId());
            } else {
                assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
            }
        });

        assertThat(mainWorkflowActionCollectionFromDb.getUnpublishedCollection().getDefaultToBranchedActionIdsMap())
                .hasSize(1);

        workflowActionCollectionFromDb
                .getUnpublishedCollection()
                .getDefaultToBranchedActionIdsMap()
                .forEach((key, value) -> {
                    NewAction jsActionInsideWorkflowActionCollectionFromDb =
                            newActionRepository.findById(key).block();
                    jsActionInsideWorkflowActionCollectionFromDb.getPolicies().forEach(policy -> {
                        if (EXECUTE_ACTIONS.getValue().equals(policy.getPermission())) {
                            assertThat(policy.getPermissionGroups()).contains(workflowBotRole.getId());
                        } else {
                            assertThat(policy.getPermissionGroups()).doesNotContain(workflowBotRole.getId());
                        }
                    });
                });

        assertThat(workflowFromDB.getTokenGenerated()).isTrue();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testArchiveBearerTokenForWebhook() {
        interactWorkflowService.generateBearerTokenForWebhook(workflow.getId()).block();
        String userEmail = workflowHelper.generateWorkflowBotUserEmail(workflow).toLowerCase();
        User workflowBotUser =
                userRepository.findByCaseInsensitiveEmail(userEmail).block();
        Criteria userEmailCriteria = Criteria.where(fieldName(QUser.user.email)).is(userEmail);
        Query userEmailQuery = Query.query(userEmailCriteria);

        Boolean archived = interactWorkflowService
                .archiveBearerTokenForWebhook(workflow.getId())
                .block();
        assertThat(archived).isTrue();
        List<UserApiKey> workflowBearerTokens = apiKeyRepository
                .getByUserIdWithoutPermission(workflowBotUser.getId())
                .collectList()
                .block();
        assertThat(workflowBearerTokens).hasSize(0);
        Workflow workflowPostArchivingToken =
                workflowRepository.findById(workflow.getId()).block();
        assertThat(workflowPostArchivingToken.getTokenGenerated()).isFalse();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPublishWorkflows() {
        String name = "testPublishWorkflows";
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(name);
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(name);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setPluginId(jsPluginId);
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setContextType(WORKFLOW);
        ActionDTO action1 = new ActionDTO();
        action1.setName("testPublishWorkflows");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("testPublishWorkflows");
        actionCollectionDTO.setActions(List.of(action1));

        ActionCollectionDTO workflowActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        NewAction beforePublishingWorkflowAction =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        ActionDTO beforePublishingPublishedAction = beforePublishingWorkflowAction.getPublishedAction();
        assertThat(beforePublishingPublishedAction).isNull();

        ActionCollection beforePublishingMainJsObject = actionCollectionRepository
                .findById(workflow.getMainJsObjectId())
                .block();

        ActionCollectionDTO beforePublishingPublishedCollectionMainJSObject =
                beforePublishingMainJsObject.getPublishedCollection();
        assertThat(beforePublishingPublishedCollectionMainJSObject).isNull();

        ActionCollection beforePublishingAdditionalJsObject = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();
        ActionCollectionDTO beforePublishingPublishedCollectionAdditionalJSObject =
                beforePublishingAdditionalJsObject.getPublishedCollection();
        assertThat(beforePublishingPublishedCollectionAdditionalJSObject).isNull();

        List<NewAction> beforePublishingActionsInsideMainJsObject = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(workflow.getMainJsObjectId()), List.of())
                .collectList()
                .block();
        assertThat(beforePublishingActionsInsideMainJsObject).hasSize(1);
        NewAction beforePublishingActionInsideMainJsObject = beforePublishingActionsInsideMainJsObject.get(0);
        ActionDTO beforePublishingPublishedActionInsideMainJsObject =
                beforePublishingActionInsideMainJsObject.getPublishedAction();
        assertThat(beforePublishingPublishedActionInsideMainJsObject.getWorkflowId())
                .isNullOrEmpty();
        assertThat(beforePublishingPublishedActionInsideMainJsObject.getName()).isNullOrEmpty();
        assertThat(beforePublishingPublishedActionInsideMainJsObject.getContextType())
                .isNull();
        assertThat(beforePublishingPublishedActionInsideMainJsObject.getActionConfiguration())
                .isNull();

        List<NewAction> beforePublishingActionsInsideAdditionalJsObject = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(workflowActionCollectionDTO.getId()), List.of())
                .collectList()
                .block();
        assertThat(beforePublishingActionsInsideAdditionalJsObject).hasSize(1);
        NewAction beforePublishingActionInsideAdditionalJsObject =
                beforePublishingActionsInsideAdditionalJsObject.get(0);
        ActionDTO beforePublishingPublishedActionInsideAdditionalJsObject =
                beforePublishingActionInsideAdditionalJsObject.getPublishedAction();
        assertThat(beforePublishingPublishedActionInsideAdditionalJsObject.getWorkflowId())
                .isNullOrEmpty();
        assertThat(beforePublishingPublishedActionInsideAdditionalJsObject.getName())
                .isNullOrEmpty();
        assertThat(beforePublishingPublishedActionInsideAdditionalJsObject.getContextType())
                .isNull();
        assertThat(beforePublishingPublishedActionInsideAdditionalJsObject.getActionConfiguration())
                .isNull();

        Workflow publishedWorkflow =
                interactWorkflowService.publishWorkflow(workflow.getId()).block();
        assertThat(publishedWorkflow.getLastDeployedAt()).isNotEmpty();
        assertThat(Instant.parse(publishedWorkflow.getLastDeployedAt())).isBefore(Instant.now());

        NewAction afterPublishingWorkflowAction =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        ActionDTO afterPublishingPublishedAction = afterPublishingWorkflowAction.getPublishedAction();
        assertThat(afterPublishingPublishedAction.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(afterPublishingPublishedAction.getName()).isEqualTo(name);
        assertThat(afterPublishingPublishedAction.getContextType()).isEqualTo(WORKFLOW);
        assertThat(afterPublishingPublishedAction.getActionConfiguration()).isNotNull();

        ActionCollection afterPublishingMainJsObject = actionCollectionRepository
                .findById(workflow.getMainJsObjectId())
                .block();
        ActionCollectionDTO afterPublishingPublishedCollectionMainJSObject =
                afterPublishingMainJsObject.getPublishedCollection();
        assertThat(afterPublishingPublishedCollectionMainJSObject.getWorkflowId())
                .isEqualTo(workflow.getId());
        assertThat(afterPublishingPublishedCollectionMainJSObject.getName()).isEqualTo("Main");
        assertThat(afterPublishingPublishedCollectionMainJSObject.getContextType())
                .isEqualTo(WORKFLOW);

        ActionCollection afterPublishingAdditionalJsObject = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();
        ActionCollectionDTO afterPublishingPublishedCollectionAdditionalJSObject =
                afterPublishingAdditionalJsObject.getPublishedCollection();
        assertThat(afterPublishingPublishedCollectionAdditionalJSObject.getWorkflowId())
                .isEqualTo(workflow.getId());
        assertThat(afterPublishingPublishedCollectionAdditionalJSObject.getName())
                .isEqualTo(name);
        assertThat(afterPublishingPublishedCollectionAdditionalJSObject.getContextType())
                .isEqualTo(WORKFLOW);

        List<NewAction> afterPublishingActionsInsideMainJsObject = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(workflow.getMainJsObjectId()), List.of())
                .collectList()
                .block();
        assertThat(afterPublishingActionsInsideMainJsObject).hasSize(1);
        NewAction afterPublishingActionInsideMainJsObject = afterPublishingActionsInsideMainJsObject.get(0);
        ActionDTO afterPublishingPublishedActionInsideMainJsObject =
                afterPublishingActionInsideMainJsObject.getPublishedAction();
        assertThat(afterPublishingPublishedActionInsideMainJsObject.getWorkflowId())
                .isEqualTo(workflow.getId());
        assertThat(afterPublishingPublishedActionInsideMainJsObject.getName()).isEqualTo("executeWorkflow");
        assertThat(afterPublishingPublishedActionInsideMainJsObject.getContextType())
                .isEqualTo(WORKFLOW);
        assertThat(afterPublishingPublishedActionInsideMainJsObject.getActionConfiguration())
                .isNotNull();

        List<NewAction> afterPublishingActionsInsideAdditionalJsObject = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(workflowActionCollectionDTO.getId()), List.of())
                .collectList()
                .block();
        assertThat(afterPublishingActionsInsideAdditionalJsObject).hasSize(1);
        NewAction afterPublishingActionInsideAdditionalJsObject = afterPublishingActionsInsideAdditionalJsObject.get(0);
        ActionDTO afterPublishingPublishedActionInsideAdditionalJsObject =
                afterPublishingActionInsideAdditionalJsObject.getPublishedAction();
        assertThat(afterPublishingPublishedActionInsideAdditionalJsObject.getWorkflowId())
                .isEqualTo(workflow.getId());
        assertThat(afterPublishingPublishedActionInsideAdditionalJsObject.getName())
                .isEqualTo(name);
        assertThat(afterPublishingPublishedActionInsideAdditionalJsObject.getContextType())
                .isEqualTo(WORKFLOW);
        assertThat(afterPublishingPublishedActionInsideAdditionalJsObject.getActionConfiguration())
                .isNotNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testTriggerWorkflow_workflowNotPublished() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Cookie", "Cookie");
        Mono<JSONObject> triggerWorkflowMono = interactWorkflowService.triggerWorkflow(workflow.getId(), headers, null);
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, triggerWorkflowMono::block);
        assertThat(unsupportedException.getMessage())
                .isEqualTo(AppsmithError.WORKFLOW_NOT_TRIGGERED_WORKFLOW_NOT_PUBLISHED.getMessage(workflow.getId()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testTriggerWorkflow() {
        Mockito.doReturn(Mono.just(new JSONObject()))
                .when(workflowProxyHelper)
                .triggerWorkflowOnProxy(Mockito.any(), Mockito.any());
        String testName = "testTriggerWorkflow";

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName("Action - " + testName);
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("JS Object - " + testName);
        actionCollectionDTO.setBody("Body - " + testName);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setContextType(WORKFLOW);
        actionCollectionDTO.setPluginId(jsPluginId);
        actionCollectionDTO.setPluginType(PluginType.JS);
        ActionDTO action1 = new ActionDTO();
        action1.setName("Action in JS Object - " + testName);
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("Action in JS Object - " + testName);
        actionCollectionDTO.setActions(List.of(action1));

        ActionCollectionDTO additionalWorkflowJsObject = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        interactWorkflowService.publishWorkflow(workflow.getId()).block();
        String apiKey = interactWorkflowService
                .generateBearerTokenForWebhook(workflow.getId())
                .block();
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Appsmith-Key", apiKey);
        JSONObject triggered = interactWorkflowService
                .triggerWorkflow(workflow.getId(), headers, null)
                .block();

        assertThat(triggered.toString()).isEqualTo((new JSONObject()).toString());

        List<ActionViewDTO> actionViewDTOList = newActionService
                .getActionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .block();

        assertThat(actionViewDTOList).hasSize(1);
        ActionViewDTO actionViewDTO = actionViewDTOList.get(0);
        assertThat(actionViewDTO.getId()).isEqualTo(workflowActionDTO.getId());
        assertThat(actionViewDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(actionViewDTO.getName()).isEqualTo(workflowActionDTO.getName());

        List<ActionCollectionViewDTO> actionCollectionViewDTOList = actionCollectionService
                .getActionCollectionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .block();

        assertThat(actionCollectionViewDTOList).hasSize(2);
        List<String> jsObjectsIdList = actionCollectionViewDTOList.stream()
                .map(ActionCollectionViewDTO::getId)
                .toList();
        assertThat(jsObjectsIdList)
                .containsExactlyInAnyOrder(workflow.getMainJsObjectId(), additionalWorkflowJsObject.getId());

        actionCollectionViewDTOList.forEach(actionCollectionViewDTO -> {
            ActionCollection actionCollection = actionCollectionRepository
                    .findById(actionCollectionViewDTO.getId())
                    .block();
            assertThat(actionCollectionViewDTO.getBody()).isNotNull();
            assertThat(actionCollection.getPublishedCollection()).isNotNull();
            assertThat(actionCollectionViewDTO.getName())
                    .isEqualTo(actionCollection.getPublishedCollection().getName());
            assertThat(actionCollectionViewDTO.getBody())
                    .isEqualTo(actionCollection.getPublishedCollection().getBody());
            assertThat(actionCollectionViewDTO.getActions()).hasSize(1);
            ActionDTO actionInJsObject = actionCollectionViewDTO.getActions().get(0);
            assertThat(actionCollection.getPublishedCollection().getDefaultToBranchedActionIdsMap())
                    .containsKey(actionInJsObject.getId());
            NewAction newAction =
                    newActionRepository.findById(actionInJsObject.getId()).block();
            assertThat(newAction.getPublishedAction()).isNotNull();
            assertThat(actionInJsObject.getName())
                    .isEqualTo(newAction.getPublishedAction().getName());
            assertThat(actionInJsObject.getFullyQualifiedName())
                    .isEqualTo(newAction.getPublishedAction().getFullyQualifiedName());
            assertThat(actionInJsObject.getActionConfiguration()).isNotNull();
            assertThat(newAction.getPublishedAction().getActionConfiguration()).isNotNull();
            assertThat(actionInJsObject.getActionConfiguration().getBody())
                    .isEqualTo(newAction
                            .getPublishedAction()
                            .getActionConfiguration()
                            .getBody());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    public void testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations() {
        String name = "testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations";

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.put(FieldName.WORKFLOW_ID, List.of(workflow.getId()));

        ActionDTO actionDTO1 = new ActionDTO();
        actionDTO1.setName(name + "1");
        actionDTO1.setWorkflowId(workflow.getId());
        actionDTO1.setDatasource(datasource);
        actionDTO1.setActionConfiguration(actionConfiguration);
        actionDTO1.setWorkspaceId(workspace.getId());
        actionDTO1.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO1 = layoutActionService
                .createSingleActionWithBranch(actionDTO1, null)
                .block();

        ActionDTO actionDTO2 = new ActionDTO();
        actionDTO2.setName(name + "2");
        actionDTO2.setWorkflowId(workflow.getId());
        actionDTO2.setDatasource(datasource);
        actionDTO2.setActionConfiguration(actionConfiguration);
        actionDTO2.setWorkspaceId(workspace.getId());
        actionDTO2.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO2 = layoutActionService
                .createSingleActionWithBranch(actionDTO2, null)
                .block();

        // State 1: Workflow Not Published

        // Check the count of Unpublished Actions.
        // There is 2 unpublished action created above.
        // 1. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1
        // 2. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations2

        // Check the count of published actions.
        // There are 0 published actions as workflow has never been published.

        // In total, there should be 3 NewActions.
        // 1. Child Action of Main JS Object in Workflow.
        // 2. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1
        // 3. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations2

        assertStatesWorkflowActions(params, 0, 2, 3);

        // State 1: Workflow Not Published

        // State 2: Workflow Not Published + Unpublished Workflow Action 2 deleted

        layoutActionService
                .deleteUnpublishedAction(workflowActionDTO2.getId(), null)
                .block();

        // Check the count of Unpublished Actions.
        // There is 1 unpublished action created above.
        // 1. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        // Check the count of published actions.
        // There are 0 published actions as workflow has never been published.

        // In total, there should be 2 NewActions.
        // 1. Child Action of Main JS Object in Workflow.
        // 2. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        assertStatesWorkflowActions(params, 0, 1, 2);

        // State 2: Workflow Not Published + Workflow Action 2 deleted

        // State 3: Workflow Published

        interactWorkflowService.publishWorkflow(workflow.getId()).block();

        // Check the count of Unpublished Actions.
        // There is 1 unpublished action created above.
        // 1. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        // Check the count of published actions.
        // There are 1 published actions as workflow has never been published.
        // 1. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        // In total, there should be 2 NewActions.
        // 1. Child Action of Main JS Object in Workflow.
        // 2. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        assertStatesWorkflowActions(params, 1, 1, 2);

        // State 3: Workflow Published

        // State 4: Workflow Published Once + Workflow Action 1 deleted

        layoutActionService
                .deleteUnpublishedAction(workflowActionDTO1.getId(), null)
                .block();

        // Check the count of Unpublished Actions.
        // There is 0 unpublished action created above.

        // There is 1 published action as workflow has now been published.
        // 1. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        // In total, there should be 2 NewActions.
        // 1. Child Action of Main JS Object in Workflow.
        // 2. testWorkflowsActionsEndToEnd_checkPublishedAndUnpublishedActionsCountAfterUserOperations1

        assertStatesWorkflowActions(params, 1, 0, 2);

        // State 4: Workflow Published Once + Workflow Action 1 deleted

        // State 5: Workflow Published Again

        interactWorkflowService.publishWorkflow(workflow.getId()).block();

        // Check the count of Unpublished Actions.
        // There is 0 unpublished action created above.

        // There is 0 published action as workflow has now been published again.

        // In total, there should be 1 NewActions.
        // 1. Child Action of Main JS Object in Workflow.

        assertStatesWorkflowActions(params, 0, 0, 1);

        // State 5: Workflow Published Again
    }

    private void assertStatesWorkflowActions(
            MultiValueMap<String, String> params,
            int expectedPublishedActionsCount,
            int expectedUnpublishedActionsCount,
            int expectedNewActionsInDbCount) {
        List<ActionDTO> unpublishedActions = newActionService
                .getUnpublishedActionsExceptJs(params)
                .collectList()
                .block();
        assertThat(unpublishedActions).hasSize(expectedUnpublishedActionsCount);

        List<ActionViewDTO> publishedActions = newActionService
                .getActionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .block();
        assertThat(publishedActions).hasSize(expectedPublishedActionsCount);

        List<NewAction> newActionsFromDb =
                newActionRepository.findAll().collectList().block();
        assertThat(newActionsFromDb).hasSize(expectedNewActionsInDbCount);
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    public void testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations() {
        String name =
                "testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations";

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.put(FieldName.WORKFLOW_ID, List.of(workflow.getId()));

        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName(name + "1");
        actionCollectionDTO1.setWorkflowId(workflow.getId());
        actionCollectionDTO1.setPluginId(jsPluginId);
        actionCollectionDTO1.setPluginType(PluginType.JS);
        actionCollectionDTO1.setWorkspaceId(workspace.getId());
        actionCollectionDTO1.setContextType(WORKFLOW);
        ActionDTO action1 = new ActionDTO();
        action1.setName(name + "1");
        action1.setActionConfiguration(actionConfiguration);
        action1.getActionConfiguration().setBody(name + "1");
        actionCollectionDTO1.setActions(List.of(action1));

        ActionCollectionDTO workflowActionCollectionDTO1 = layoutCollectionService
                .createCollection(actionCollectionDTO1, null)
                .block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName(name + "2");
        actionCollectionDTO2.setWorkflowId(workflow.getId());
        actionCollectionDTO2.setPluginId(jsPluginId);
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setWorkspaceId(workspace.getId());
        actionCollectionDTO2.setContextType(WORKFLOW);
        ActionDTO action2 = new ActionDTO();
        action2.setName(name + "2");
        action2.setActionConfiguration(actionConfiguration);
        action2.getActionConfiguration().setBody(name + "2");
        actionCollectionDTO2.setActions(List.of(action2));

        ActionCollectionDTO workflowActionCollectionDTO2 = layoutCollectionService
                .createCollection(actionCollectionDTO2, null)
                .block();

        // State 1: Workflow Not Published

        // Check the count of Unpublished ActionCollections.
        // There is 3 unpublished JS Objects created above.
        // 1. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 2. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations2
        // 3. main

        // Check the count of published ActionCollections.
        // There are 0 published actions as workflow has never been published.

        // In total, there should be 3 ActionCollections.
        // 1. main
        // 2. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 3. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations2

        assertStatesWorkflowActionCollections(params, 0, 3, 3);

        // State 1: Workflow Not Published

        // State 2: Workflow Not Published + Unpublished Workflow Action Collection 2 deleted

        actionCollectionService
                .deleteUnpublishedActionCollection(workflowActionCollectionDTO2.getId(), null)
                .block();

        // Check the count of Unpublished ActionCollections.
        // There is 2 unpublished ActionCollections.
        // 1. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 2. main

        // Check the count of published ActionCollections.
        // There are 0 published ActionCollections as workflow has never been published.

        // In total, there should be 2 ActionCollections.
        // 1. main
        // 2. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1

        assertStatesWorkflowActionCollections(params, 0, 2, 2);

        // State 2: Workflow Not Published + Workflow Action Collection 2 deleted

        // State 3: Workflow Published

        interactWorkflowService.publishWorkflow(workflow.getId()).block();

        // Check the count of Unpublished ActionCollections.
        // There are 2 unpublished actions created above.
        // 1. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 2. main

        // Check the count of published ActionCollections.
        // There are 2 published ActionCollections.
        // 1. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 2. main

        // In total, there should be 2 ActionCollections.
        // 1. main
        // 2. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1

        assertStatesWorkflowActionCollections(params, 2, 2, 2);

        // State 3: Workflow Published

        // State 4: Workflow Published Once + Workflow Action Collection 1 deleted

        actionCollectionService
                .deleteUnpublishedActionCollection(workflowActionCollectionDTO1.getId(), null)
                .block();

        // Check the count of Unpublished ActionCollections.
        // There is 1 unpublished action created above.
        // 1. main

        // There is 2 published ActionCollections as workflow has now been published.
        // 1. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1
        // 2. main

        // In total, there should be 2 ActionCollections.
        // 1. main
        // 2. testWorkflowsCollectionsEndToEnd_checkPublishedAndUnpublishedCollectionsCountAfterUserOperations1

        assertStatesWorkflowActionCollections(params, 2, 1, 2);

        // State 4: Workflow Published Once + Workflow ActionCollection 1 deleted

        // State 5: Workflow Published Again

        interactWorkflowService.publishWorkflow(workflow.getId()).block();

        // Check the count of Unpublished ActionCollections.
        // There is 1 unpublished ActionCollections created above.
        // 1. main

        // There is 1 published ActionCollection.
        // 1. main

        // In total, there should be 1 ActionCollection.
        // 1. main

        assertStatesWorkflowActionCollections(params, 1, 1, 1);

        // State 5: Workflow Published Again
    }

    private void assertStatesWorkflowActionCollections(
            MultiValueMap<String, String> params,
            int expectedPublishedCollectionsCount,
            int expectedUnpublishedCollectionsCount,
            int expectedCollectionsInDbCount) {
        List<ActionCollectionDTO> unpublishedActionCollections = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(params, false, null)
                .collectList()
                .block();
        assertThat(unpublishedActionCollections).hasSize(expectedUnpublishedCollectionsCount);

        List<ActionCollectionViewDTO> publishedActionCollections = actionCollectionService
                .getActionCollectionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .block();
        assertThat(publishedActionCollections).hasSize(expectedPublishedCollectionsCount);

        List<ActionCollection> actionCollectionsFromDb =
                actionCollectionRepository.findAll().collectList().block();
        assertThat(actionCollectionsFromDb).hasSize(expectedCollectionsInDbCount);
    }
}
