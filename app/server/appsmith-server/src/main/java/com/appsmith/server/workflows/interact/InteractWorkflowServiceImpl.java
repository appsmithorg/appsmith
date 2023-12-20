package com.appsmith.server.workflows.interact;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApiKeyService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.workflows.helpers.WorkflowHelper;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import com.fasterxml.jackson.databind.JsonNode;
import com.mongodb.bulk.BulkWriteResult;
import jakarta.validation.Validator;
import org.json.JSONObject;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AppsmithRole.WORKFLOW_EXECUTOR;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
public class InteractWorkflowServiceImpl extends InteractWorkflowServiceCECompatibleImpl
        implements InteractWorkflowService {
    private final WorkflowPermission workflowPermission;
    private final UserRepository userRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final TenantService tenantService;
    private final RoleConfigurationSolution roleConfigurationSolution;
    private final PolicyGenerator policyGenerator;
    private final ApiKeyService apiKeyService;
    private final WorkflowHelper workflowHelper;
    private final TransactionalOperator transactionalOperator;
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ActionCollectionService actionCollectionService;
    private final WorkflowProxyHelper workflowProxyHelper;

    public InteractWorkflowServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            WorkflowPermission workflowPermission,
            UserRepository userRepository,
            PermissionGroupRepository permissionGroupRepository,
            TenantService tenantService,
            RoleConfigurationSolution roleConfigurationSolution,
            PolicyGenerator policyGenerator,
            ApiKeyService apiKeyService,
            WorkflowHelper workflowHelper,
            TransactionalOperator transactionalOperator,
            NewActionService newActionService,
            ActionPermission actionPermission,
            ActionCollectionService actionCollectionService,
            WorkflowProxyHelper workflowProxyHelper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workflowPermission = workflowPermission;
        this.userRepository = userRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.tenantService = tenantService;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.policyGenerator = policyGenerator;
        this.apiKeyService = apiKeyService;
        this.workflowHelper = workflowHelper;
        this.transactionalOperator = transactionalOperator;
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
        this.actionCollectionService = actionCollectionService;
        this.workflowProxyHelper = workflowProxyHelper;
    }

    /**
     * <p>
     * Generates a bearer token for a webhook associated with the specified workflow in a reactive manner.
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow based on the provided workflow ID with edit permissions checked.</li>
     *   <li>If the workflow is not found, an error with the corresponding ACL no-resource-found code is thrown.</li>
     *   <li>Retrieves the default tenant ID.</li>
     *   <li>Creates or retrieves the workflow bot user associated with the workflow and the default tenant.</li>
     *   <li>Creates or retrieves the workflow bot role associated with the workflow and the workflow bot user.</li>
     *   <li>Associates the workflow bot role with related resources using the workflow and workflow bot role.</li>
     *   <li>Generates an API key for the workflow bot user, archiving any existing API keys for the user.</li>
     *   <li>Updates without permission the workflow to indicate that the token has been generated.</li>
     * </ol>
     * </p>
     *
     * @param workflowId The ID of the workflow for which the webhook bearer token will be generated.
     * @return A Mono emitting the generated bearer token for the webhook.
     *         The Mono will emit an error if the workflow is not found or if any part of the generation process
     *         encounters an issue.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<String> generateBearerTokenForWebhook(String workflowId) {
        Mono<Workflow> workflowMono =
                findById(workflowId, workflowPermission.getEditPermission()).cache();
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();

        // Create Workflow user
        Mono<User> workflowBotUserMono = Mono.zip(workflowMono, defaultTenantIdMono)
                .flatMap(pair -> {
                    Workflow workflow = pair.getT1();
                    String tenantId = pair.getT2();
                    return getOrCreateWorkflowBotUser(workflow, tenantId);
                })
                .cache();
        // Create Role
        Mono<PermissionGroup> workflowBotRoleMono = Mono.zip(workflowMono, workflowBotUserMono)
                .flatMap(pair -> {
                    Workflow workflow = pair.getT1();
                    User botUser = pair.getT2();
                    return getOrCreateWorkflowRole(workflow, botUser);
                });
        // Associate role with related resources.
        Mono<Long> associateWorkflowAndRelatedResourcesWithWorkflowRoleMono = Mono.zip(
                        workflowMono, workflowBotRoleMono)
                .flatMap(pair -> {
                    Workflow workflow = pair.getT1();
                    PermissionGroup workflowRole = pair.getT2();
                    return assignWorkflowRoleWithResources(workflow, workflowRole);
                })
                .cache();
        // Generate API Key for the User
        Mono<String> generateApiKeyForWorkflowBotUser = workflowBotUserMono
                .flatMap(workflowBotUser -> {
                    ApiKeyRequestDto apiKeyRequestDto = ApiKeyRequestDto.builder()
                            .email(workflowBotUser.getUsername())
                            .build();
                    return apiKeyService
                            .archiveAllApiKeysForUser(workflowBotUser.getUsername())
                            .then(apiKeyService.generateApiKey(apiKeyRequestDto));
                })
                .cache();

        // Update the workflow to indicate that token has been generated
        Mono<String> generateApiKeyAndUpdateTokenGeneratedMono =
                generateApiKeyForWorkflowBotUser.flatMap(generatedToken -> repository
                        .updateGeneratedTokenForWorkflow(workflowId, TRUE, Optional.empty())
                        .thenReturn(generatedToken));

        return workflowBotUserMono
                .then(workflowBotRoleMono)
                .then(associateWorkflowAndRelatedResourcesWithWorkflowRoleMono)
                .then(generateApiKeyAndUpdateTokenGeneratedMono);
    }

    /**
     * <p>
     * Archives the bearer token and associated resources for the webhook of the specified workflow in a reactive manner.
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow based on the provided workflow ID with edit permissions checked.</li>
     *   <li>If the workflow is not found, an error with the corresponding ACL no-access error code is thrown.</li>
     *   <li>Retrieves the default tenant ID.</li>
     *   <li>Retrieves the workflow bot user associated with the workflow and the default tenant.</li>
     *   <li>Archives any existing API keys for the user without permission check.</li>
     *   <li>Updates the generated token for the workflow to indicate it is archived.</li>
     * </ol>
     * </p>
     *
     * @param workflowId The ID of the workflow for which the webhook bearer token and associated resources will be archived.
     * @return A Mono emitting a boolean value indicating the success of the archival process.
     *         The Mono will emit an error if the workflow is not found.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Boolean> archiveBearerTokenForWebhook(String workflowId) {
        Mono<Workflow> workflowMono = findById(workflowId, workflowPermission.getEditPermission());
        Mono<String> tenantIdMono = tenantService.getDefaultTenantId();
        return Mono.zip(tenantIdMono, workflowMono)
                .flatMap(pair -> {
                    String tenantId = pair.getT1();
                    Workflow workflow = pair.getT2();
                    return getWorkflowBotUser(workflow, tenantId);
                })
                .flatMap(workflowBotUser ->
                        apiKeyService.archiveAllApiKeysForUserWithoutPermissionCheck(workflowBotUser.getUsername()))
                .then(repository.updateGeneratedTokenForWorkflow(workflowId, FALSE, Optional.empty()))
                .thenReturn(TRUE);
    }

    /**
     * Publishes a workflow identified by the provided workflow ID.
     *
     * <p>
     * The method performs the following steps:
     * </p>
     * <ol>
     *   <li>Retrieves the workflow using the provided workflow ID and publish permission.</li>
     *   <li>Sets the last deployed timestamp of the workflow to the current instant.</li>
     *   <li>Publishes actions associated with the workflow using {@link NewActionService#publishActionsForWorkflows}.</li>
     *   <li>Publishes action collections associated with the workflow using {@link ActionCollectionService#publishActionCollectionsForWorkflow}.</li>
     *   <li>Saves the updated workflow with the new last deployed timestamp.</li>
     *   <li>Commits the transaction using the provided {@link TransactionalOperator}.</li>
     * </ol>
     *
     * <p>
     *
     * <p>
     * <b>Notes:</b>
     * </p>
     * <ul>
     *   <li>The workflow's last deployed timestamp is updated to the current instant.</li>
     *   <li>Actions associated with the workflow are published, and the method caches the updated workflow.</li>
     *   <li>The transactional operator is used to ensure atomicity of the transaction.</li>
     * </ul>
     *
     * @param workflowId The ID of the workflow to be published.
     * @return A Mono emitting the published workflow.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> publishWorkflow(String workflowId) {
        return findById(workflowId, workflowPermission.getPublishPermission())
                .flatMap(workflow -> {
                    workflow.setLastDeployedAt(Instant.now());
                    Mono<List<BulkWriteResult>> publishActionsForWorkflows =
                            newActionService.publishActionsForWorkflows(
                                    workflowId, actionPermission.getEditPermission());
                    Mono<List<ActionCollection>> publishActionCollectionsForWorkflows =
                            actionCollectionService.publishActionCollectionsForWorkflow(
                                    workflowId, actionPermission.getEditPermission());
                    Mono<Workflow> updateDeployedAtForWorkflowMono =
                            repository.save(workflow).cache();
                    return Mono.zip(
                                    updateDeployedAtForWorkflowMono,
                                    publishActionsForWorkflows,
                                    publishActionCollectionsForWorkflows)
                            .then(updateDeployedAtForWorkflowMono);
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<PermissionGroup> getOrCreateWorkflowRole(Workflow workflow, User user) {
        PermissionGroup workflowRole = new PermissionGroup();
        workflowRole.setName(workflowHelper.generateWorkflowBotRoleName(workflow));
        workflowRole.setDefaultDomainType(Workflow.class.getSimpleName());
        workflowRole.setDefaultDomainId(workflow.getId());
        workflowRole.setDescription(FieldName.WORKFLOW_EXECUTOR_DESCRIPTION);
        workflowRole.setAssignedToUserIds(Set.of(user.getId()));

        return getWorkflowBotRole(workflow).switchIfEmpty(permissionGroupRepository.save(workflowRole));
    }

    private Mono<PermissionGroup> getWorkflowBotRole(Workflow workflow) {
        return permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workflow.getId(), Workflow.class.getSimpleName())
                .filter(workflowRole1 -> workflowRole1.getName().startsWith(FieldName.WORKFLOW_EXECUTOR))
                .collectList()
                .flatMap(workflowRoleList -> {
                    if (!CollectionUtils.isEmpty(workflowRoleList)) {
                        // Should always have 1 single workflow executor role
                        return Mono.just(workflowRoleList.get(0));
                    }
                    return Mono.empty();
                });
    }

    private Mono<User> getOrCreateWorkflowBotUser(Workflow workflow, String tenantId) {
        String userEmail = workflowHelper.generateWorkflowBotUserEmail(workflow);
        String userName = workflowHelper.generateWorkflowBotUserName(workflow);
        User user = new User();
        user.setEmail(userEmail);
        user.setName(userName);
        user.setTenantId(tenantId);
        return getWorkflowBotUser(workflow, tenantId).switchIfEmpty(userRepository.save(user));
    }

    private Mono<User> getWorkflowBotUser(Workflow workflow, String tenantId) {
        String userEmail = workflowHelper.generateWorkflowBotUserEmail(workflow);
        return userRepository
                .findByCaseInsensitiveEmail(userEmail)
                .filter(user1 -> tenantId.equals(user1.getTenantId()));
    }

    private Mono<Long> assignWorkflowRoleWithResources(Workflow workflow, PermissionGroup workflowRole) {
        Map<String, List<AclPermission>> permissionListMapForWorkflowExecutorRole =
                getPermissionListMapForWorkflowExecutorRole();
        return roleConfigurationSolution.updateWorkflowAndRelatedResourcesWithPermissionForRole(
                workflow.getId(),
                workflow.getWorkspaceId(),
                workflowRole.getId(),
                permissionListMapForWorkflowExecutorRole,
                Map.of());
    }

    private Map<String, List<AclPermission>> getPermissionListMapForWorkflowExecutorRole() {
        AppsmithRole appsmithRole = WORKFLOW_EXECUTOR;
        List<AclPermission> datasourcePermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Datasource.class))
                .toList();

        List<AclPermission> environmentPermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Environment.class))
                .toList();

        List<AclPermission> workflowPermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workflow.class))
                .toList();

        List<AclPermission> actionPermissions =
                policyGenerator.getAllChildPermissions(workflowPermissions, Action.class).stream()
                        .toList();

        return Map.of(
                Datasource.class.getSimpleName(), datasourcePermissions,
                Environment.class.getSimpleName(), environmentPermissions,
                ActionCollection.class.getSimpleName(), actionPermissions,
                NewAction.class.getSimpleName(), actionPermissions,
                Workflow.class.getSimpleName(), workflowPermissions);
    }

    /**
     * Triggers the execution of a workflow with the provided ID, using the specified HTTP headers.
     * Validates the headers before triggering the workflow and returns a JSON object representing the result.
     *
     * <p>
     * <b>Triggering Steps:</b>
     * </p>
     * <ol>
     *   <li>Retrieve the workflow using the provided ID and check for execution permission.
     *       If permission is granted, proceed with triggering the workflow; otherwise, return an error Mono.</li>
     *   <li>Generate a WorkflowTriggerProxyDTO for the workflow using the {@link #generateWorkflowTriggerProxyDTOMono} method.</li>
     *   <li>Trigger the workflow on the proxy using the {@link WorkflowProxyHelper#triggerWorkflowOnProxy(WorkflowTriggerProxyDTO, HttpHeaders)} method.</li>
     *   <li>If the triggering is successful, return a Mono emitting the result as a JSONObject.</li>
     *   <li>If any step fails, return an error Mono with the corresponding error information.</li>
     * </ol>
     *
     * @param workflowId The ID of the workflow to be triggered.
     * @param headers The HttpHeaders containing information required for triggering the workflow.
     * @return A Mono emitting a JSONObject representing the result of the triggered workflow.
     *         If validation fails or an error occurs during execution, an error Mono is returned.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JSONObject> triggerWorkflow(String workflowId, HttpHeaders headers, JsonNode triggerData) {
        Mono<Workflow> workflowMono = findById(workflowId, workflowPermission.getExecutePermission());

        Mono<WorkflowTriggerProxyDTO> workflowTriggerProxyDTOMono =
                workflowMono.flatMap(workflow -> generateWorkflowTriggerProxyDTOMono(workflow, triggerData));

        return workflowTriggerProxyDTOMono.flatMap(workflowTriggerProxyDTO ->
                workflowProxyHelper.triggerWorkflowOnProxy(workflowTriggerProxyDTO, headers));
    }

    private Mono<Workflow> findById(String workflowId, AclPermission aclPermission) {
        return repository
                .findById(workflowId, Optional.of(aclPermission))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW_ID, workflowId)));
    }

    /**
     * Generates a Mono emitting a WorkflowTriggerProxyDTO for the provided Workflow.
     * The Mono emits an error if the Workflow is not published, or if the Main JS Object is not found.
     *
     * <p>
     * <b>Generation Steps:</b>
     * </p>
     * <ol>
     *   <li>If the Workflow is not published, emit an error indicating that the Workflow was never published.</li>
     *   <li>Retrieve the list of ActionViewDTOs and ActionCollectionViewDTOs associated with the Workflow.</li>
     *   <li>Check if the Main JS Object is present in the ActionCollectionViewDTOs. If not, emit an error indicating the Main JS Object is not found.</li>
     *   <li>If all checks pass, generate and return a WorkflowTriggerProxyDTO based on the retrieved information.</li>
     * </ol>
     *
     * @param workflow The Workflow for which the proxy trigger DTO is generated.
     * @return A Mono emitting a WorkflowTriggerProxyDTO if the generation is successful.
     *         If the Workflow is not published or the Main JS Object is not found, an error Mono is returned.
     *
     */
    private Mono<WorkflowTriggerProxyDTO> generateWorkflowTriggerProxyDTOMono(Workflow workflow, JsonNode triggerData) {
        Mono<List<ActionViewDTO>> actionsForViewModeForWorkflowMono = newActionService
                .getActionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .cache();
        Mono<List<ActionCollectionViewDTO>> actionCollectionsForViewModeForWorkflowMono = actionCollectionService
                .getActionCollectionsForViewModeForWorkflow(workflow.getId(), null)
                .collectList()
                .cache();

        if (!workflow.isWorkflowPublished()) {
            return Mono.error(new AppsmithException(
                    AppsmithError.WORKFLOW_NOT_TRIGGERED_WORKFLOW_NOT_PUBLISHED, workflow.getId()));
        }

        return Mono.zip(actionsForViewModeForWorkflowMono, actionCollectionsForViewModeForWorkflowMono)
                .flatMap(tuple -> {
                    List<ActionViewDTO> actionViewDTOList = tuple.getT1();
                    List<ActionCollectionViewDTO> actionCollectionViewDTOList = tuple.getT2();
                    if (!isMainJsObjectPresentInActionCollectionViewDTOs(workflow, actionCollectionViewDTOList)) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.WORKFLOW_NOT_TRIGGERED_MAIN_JS_OBJECT_NOT_FOUND, workflow.getId()));
                    }
                    return generateWorkflowProxyTriggerDTO(
                            workflow, actionViewDTOList, actionCollectionViewDTOList, triggerData);
                });
    }

    /**
     * Checks if the Main JS Object associated with the provided Workflow is present in the given collection of ActionCollectionViewDTOs.
     *
     * @param workflow The Workflow for which the Main JS Object presence is checked.
     * @param actionCollectionViewDTOCollection The collection of ActionCollectionViewDTOs to search for the Main JS Object.
     * @return {@code true} if the Main JS Object is present; {@code false} otherwise.
     *
     */
    private boolean isMainJsObjectPresentInActionCollectionViewDTOs(
            Workflow workflow, Collection<ActionCollectionViewDTO> actionCollectionViewDTOCollection) {
        if (CollectionUtils.isEmpty(actionCollectionViewDTOCollection)) {
            return FALSE;
        }
        return actionCollectionViewDTOCollection.stream()
                .map(ActionCollectionViewDTO::getId)
                .collect(Collectors.toSet())
                .contains(workflow.getMainJsObjectId());
    }

    /**
     * Generates a WorkflowTriggerProxyDTO based on the provided Workflow, ActionViewDTOs, and ActionCollectionViewDTOs.
     * <p>
     * <b>Steps:</b>
     * </p>
     * <ol>
     *   <li>Create a mapping of Action names to their corresponding Action IDs.</li>
     *   <li>Create a mapping of Action Collection names to their corresponding ActionCollectionViewDTOs,
     *       excluding the Main JS Object.</li>
     *   <li>Find the ActionCollectionViewDTO representing the Workflow definition.</li>
     *   <li>If the Workflow definition is found, build and return a WorkflowTriggerProxyDTO with the collected information.</li>
     *   <li>If the Workflow is not published or the Main JS Object is not found, throw an AppsmithException.</li>
     * </ol>
     *
     * @param workflow The Workflow for which the proxy trigger DTO is generated.
     * @param actionViewDTOList The list of ActionViewDTOs associated with the Workflow.
     * @param actionCollectionViewDTOList The list of ActionCollectionViewDTOs associated with the Workflow.
     * @return A Mono containing the WorkflowTriggerProxyDTO, representing the proxy trigger information.
     *         If the Workflow is not published or the Main JS Object is not found, an error Mono is returned.
     *
     * <p>
     * <b>DTO Components:</b>
     * </p>
     * <ul>
     *   <li>{@code workflowDef}: The ActionCollectionViewDTO representing the Workflow definition.</li>
     *   <li>{@code actionNameToActionIdMap}: A mapping of Action names to their corresponding Action IDs.</li>
     *   <li>{@code actionCollectionNameToActionCollection}: A mapping of Action Collection names to their corresponding ActionCollectionViewDTOs,
     *       excluding the Main JS Object.</li>
     * </ul>
     *
     * @throws AppsmithException If the Workflow is not published or the Main JS Object is not found.
     */
    private Mono<WorkflowTriggerProxyDTO> generateWorkflowProxyTriggerDTO(
            Workflow workflow,
            List<ActionViewDTO> actionViewDTOList,
            List<ActionCollectionViewDTO> actionCollectionViewDTOList,
            JsonNode triggerData) {
        Map<String, String> actionNameToActionIdMap =
                actionViewDTOList.stream().collect(Collectors.toMap(ActionViewDTO::getName, ActionViewDTO::getId));
        Map<String, ActionCollectionViewDTO> actionCollectionNameToActionCollectionViewDTOMap =
                actionCollectionViewDTOList.stream()
                        .filter(actionCollectionViewDTO ->
                                !workflow.getMainJsObjectId().equals(actionCollectionViewDTO.getId()))
                        .collect(Collectors.toMap(ActionCollectionViewDTO::getName, obj -> obj));
        Optional<ActionCollectionViewDTO> workflowDef = actionCollectionViewDTOList.stream()
                .filter(actionCollectionViewDTO -> workflow.getMainJsObjectId().equals(actionCollectionViewDTO.getId()))
                .findFirst();
        return workflowDef
                .map(s -> Mono.just(WorkflowTriggerProxyDTO.builder()
                        .workflowId(workflow.getId())
                        .workflowDef(s)
                        .actionNameToActionIdMap(actionNameToActionIdMap)
                        .actionCollectionNameToActionCollection(actionCollectionNameToActionCollectionViewDTOMap)
                        .triggerData(triggerData)
                        .build()))
                .orElseGet(() -> Mono.error(new AppsmithException(
                        AppsmithError.WORKFLOW_NOT_TRIGGERED_MAIN_JS_OBJECT_NOT_FOUND, workflow.getId())));
    }
}
