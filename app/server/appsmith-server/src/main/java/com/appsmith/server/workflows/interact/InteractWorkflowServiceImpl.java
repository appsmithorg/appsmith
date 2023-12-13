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
import com.appsmith.server.dtos.ApiKeyRequestDto;
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
import com.appsmith.server.workflows.permission.WorkflowPermission;
import com.mongodb.bulk.BulkWriteResult;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AppsmithRole.WORKFLOW_EXECUTOR;
import static com.appsmith.server.constants.FieldName.WORKFLOW;
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
            ActionCollectionService actionCollectionService) {
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
        Mono<Workflow> workflowMono = repository
                .findById(workflowId, workflowPermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, WORKFLOW, workflowId)))
                .cache();
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
        Mono<Workflow> workflowMono = repository
                .findById(workflowId, workflowPermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACL_NO_ACCESS_ERROR, WORKFLOW, workflowId)));
        Mono<String> tenantIdMono = tenantService.getDefaultTenantId();
        return Mono.zip(tenantIdMono, workflowMono)
                .flatMap(pair -> {
                    String tenantId = pair.getT1();
                    Workflow workflow = pair.getT2();
                    return getWorkflowBotUser(workflow, tenantId);
                })
                .flatMap(workflowBotUser ->
                        apiKeyService.archiveAllApiKeysForUserWithoutPermissionCheck(workflowBotUser.getUsername()))
                .then(repository.updateGeneratedTokenForWorkflow(workflowId, Boolean.FALSE, Optional.empty()))
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
        return repository
                .findById(workflowId, workflowPermission.getPublishPermission())
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
}
