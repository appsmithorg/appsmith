package com.appsmith.server.newactions.base;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.modules.metadata.ModuleMetadataService;
import com.appsmith.server.newactions.helpers.NewActionHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.MarketplaceService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.validations.EntityValidationService;
import com.appsmith.server.workflows.helpers.WorkflowUtils;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.UpdateResult;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.ListUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;
import static com.appsmith.server.helpers.ContextTypeUtils.isWorkflowContext;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
@Slf4j
public class NewActionServiceImpl extends NewActionServiceCEImpl implements NewActionService {
    private final PermissionGroupRepository permissionGroupRepository;
    private final DatasourceService datasourceService;
    private final PermissionGroupService permissionGroupService;
    private final PolicySolution policySolution;
    private final NewPageService newPageService;
    private final WorkflowRepository workflowRepository;
    private final EntityValidationService entityValidationService;
    private final WorkflowPermission workflowPermission;
    private final ResponseUtils responseUtils;
    private final ModuleMetadataService moduleMetadataService;

    public NewActionServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            NewActionRepository repository,
            AnalyticsService analyticsService,
            DatasourceService datasourceService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            MarketplaceService marketplaceService,
            PolicyGenerator policyGenerator,
            NewPageService newPageService,
            ApplicationService applicationService,
            PolicySolution policySolution,
            ConfigService configService,
            ResponseUtils responseUtils,
            PermissionGroupService permissionGroupService,
            NewActionHelper newActionHelper,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            EntityValidationService entityValidationService,
            ObservationRegistry observationRegistry,
            DefaultResourcesService<NewAction> defaultResourcesService,
            DefaultResourcesService<ActionDTO> dtoDefaultResourcesService,
            PermissionGroupRepository permissionGroupRepository,
            WorkflowRepository workflowRepository,
            WorkflowPermission workflowPermission,
            ModuleMetadataService moduleMetadataService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                datasourceService,
                pluginService,
                pluginExecutorHelper,
                marketplaceService,
                policyGenerator,
                newPageService,
                applicationService,
                policySolution,
                configService,
                responseUtils,
                permissionGroupService,
                newActionHelper,
                datasourcePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                entityValidationService,
                observationRegistry,
                defaultResourcesService,
                dtoDefaultResourcesService);
        this.permissionGroupRepository = permissionGroupRepository;
        this.datasourceService = datasourceService;
        this.permissionGroupService = permissionGroupService;
        this.policySolution = policySolution;
        this.newPageService = newPageService;
        this.workflowRepository = workflowRepository;
        this.entityValidationService = entityValidationService;
        this.workflowPermission = workflowPermission;
        this.responseUtils = responseUtils;
        this.moduleMetadataService = moduleMetadataService;
    }

    /**
     * To send action related general analytics events
     * Mainly used to send events that are originated frontend or backend
     *
     * @param analyticEventDTO
     * @return
     */
    public Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin) {
        switch (analyticEventDTO.getEvent()) {
                // JSObject function execute events are executed from frontend on browser
                // This will be reported to backend via API for Audit Logs
            case EXECUTE:
                return this.findById(analyticEventDTO.getResourceId(), AclPermission.EXECUTE_ACTIONS)
                        .filter(newAction -> newAction.getPluginType().equals(PluginType.JS))
                        .flatMap(newAction -> {
                            Map<String, Object> analyticsProperties = getAnalyticsProperties(newAction);
                            analyticsProperties.put(FieldName.AUDIT_LOGS_ORIGIN, origin);
                            if (analyticEventDTO.getMetadata().containsKey(FieldName.AUDIT_LOGS_VIEW_MODE)) {
                                if (null != analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_VIEW_MODE)) {
                                    Boolean isViewMode = (Boolean)
                                            analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_VIEW_MODE);
                                    String applicationMode = isViewMode
                                            ? ApplicationMode.PUBLISHED.toString()
                                            : ApplicationMode.EDIT.toString();
                                    analyticsProperties.put(FieldName.AUDIT_LOGS_VIEW_MODE, applicationMode);
                                }
                                // In case of JSObjects, the function name is passed from client
                                if (null != analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_ACTION_NAME)) {
                                    String actionName = (String)
                                            analyticEventDTO.getMetadata().get(FieldName.AUDIT_LOGS_ACTION_NAME);
                                    analyticsProperties.put(FieldName.AUDIT_LOGS_ACTION_NAME, actionName);
                                }
                            }
                            return analyticsService.sendObjectEvent(
                                    AnalyticsEvents.EXECUTE_ACTION, newAction, analyticsProperties);
                        });
        }
        return Mono.empty();
    }

    /**
     * Once the action has been validated and saved, generate a map of permission to permissionGroupIds for the existing
     * default application roles and give these roles required permissions to access the related datasource, if not already
     * given.
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Validates and saves the new action to the repository using <code>validateAndSaveActionToRepository()</code>
     *   from the super class.</li>
     *   <li>If the plugin type is JS, the datasource ID is empty, or the action is created for modules,
     *   returns the created action DTO without further checks.</li>
     *   <li>If the action is created for a workflow context, fetches the workflow by ID and
     *   updates the datasource policy map using the default workflow role ID. Then returns the created action DTO.</li>
     *   <li>If the action is created for a page context, fetches the page by ID and
     *   updates the datasource policy map using the default application role IDs. Then returns the created action DTO.</li>
     * </ol>
     *
     * @param newAction
     * @return A Mono emitting the created action DTO after validation and saving to the repository.
     *         The Mono will emit an error if any part of the validation, saving, or policy update encounters an issue.
     */
    @Override
    public Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction) {
        Mono<ActionDTO> actionDTOMono = super.validateAndSaveActionToRepository(newAction);
        return actionDTOMono.flatMap(actionDTO -> {

            /*
             * We don't want to update the Datasource policy if Plugin Type is JS
             * Or the Datasource doesn't exist.
             * Or if the Action is created for Modules
             */

            if (actionDTO.getPluginType() == PluginType.JS
                    || StringUtils.isEmpty(actionDTO.getDatasource().getId())) {
                return Mono.just(actionDTO);
            }
            if (isModuleContext(actionDTO.getContextType())) {
                return moduleMetadataService
                        .saveLastEditInformation(actionDTO.getModuleId())
                        .thenReturn(actionDTO);
            }

            /*
             * Here we are going to update the policies of the related datasource based on the context.
             * If the action has been created for a Workflow, we need to check whether a Workflow Bot Role exists or not
             * and based on that give the Workflow Bot Role ability to execute the related datasource.
             * If the action has been created for a Page, we need to check whether Default Application Roles exist or not
             * and based on that give the Default Application Roles ability to execute the related datasource.
             */
            if (WorkflowUtils.isWorkflowContext(actionDTO)) {
                return workflowRepository
                        .findById(actionDTO.getWorkflowId(), Optional.empty())
                        .flatMap(workflow -> {
                            Mono<Map<String, List<String>>> mapPermissionToDefaultWorlflowRoleIdMono =
                                    getMapDatasourcePermissionToDefaultWorkflowRoleId(newAction.getWorkflowId());
                            return updateDatasourcePolicyMap(
                                    actionDTO.getDatasource().getId(), mapPermissionToDefaultWorlflowRoleIdMono);
                        })
                        .thenReturn(actionDTO);
            }

            return newPageService
                    .findById(actionDTO.getPageId(), Optional.empty())
                    .flatMap(newPage -> {
                        Mono<Map<String, List<String>>> mapPermissionToDefaultApplicationRoleIdMono =
                                getMapDatasourcePermissionToDefaultAppRoleIds(newPage.getApplicationId());
                        return updateDatasourcePolicyMap(
                                actionDTO.getDatasource().getId(), mapPermissionToDefaultApplicationRoleIdMono);
                    })
                    .thenReturn(actionDTO);
        });
    }

    private Mono<Map<String, List<String>>> getMapDatasourcePermissionToDefaultWorkflowRoleId(String workflowId) {
        return permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workflowId, Workflow.class.getSimpleName())
                .collectList()
                .map(workflowRoles -> {
                    Map<String, List<String>> mapPermissionToDefaultWorkflowRoleId = new HashMap<>();
                    workflowRoles.forEach(workflowRole -> {
                        updatePermissionMapWithDatasourcePermissionForRoleId(
                                AppsmithRole.WORKFLOW_EXECUTOR, workflowRole, mapPermissionToDefaultWorkflowRoleId);
                    });
                    return mapPermissionToDefaultWorkflowRoleId;
                });
    }

    /**
     * Updates the policy map for the datasource based on the permissionToPermissionGroupIdMap.
     * If the permissionGroupIds are already given the respective permissions, then we simply return the datasource.
     * Else we update the policy map of the datasource, and then return it.
     *
     * @param datasourceId
     * @param permissionToPermissionGroupIdMapMono
     * @return
     */
    private Mono<Boolean> updateDatasourcePolicyMap(
            String datasourceId, Mono<Map<String, List<String>>> permissionToPermissionGroupIdMapMono) {
        return permissionToPermissionGroupIdMapMono.flatMap(permissionToPermissionGroupIdMap -> {
            if (MapUtils.isEmpty(permissionToPermissionGroupIdMap)) {
                return Mono.just(Boolean.TRUE);
            }
            return datasourceService.findById(datasourceId).flatMap(datasource -> {
                boolean doAllPermissionsExist = permissionToPermissionGroupIdMap.entrySet().stream()
                        .map(entry -> {
                            List<String> defaultApplicationRoleIds = entry.getValue();
                            return defaultApplicationRoleIds.stream()
                                    .map(id ->
                                            permissionGroupService.isEntityAccessible(datasource, entry.getKey(), id))
                                    .allMatch(Boolean.TRUE::equals);
                        })
                        .allMatch(Boolean.TRUE::equals);

                if (doAllPermissionsExist) {
                    return Mono.just(Boolean.TRUE);
                }
                Map<String, Policy> datasourcePolicyMap = new HashMap<>();
                permissionToPermissionGroupIdMap.forEach((permission, roleIds) -> {
                    Policy policy = Policy.builder()
                            .permission(permission)
                            .permissionGroups(new HashSet<>(roleIds))
                            .build();
                    datasourcePolicyMap.put(permission, policy);
                });
                Datasource updatedDatasource =
                        policySolution.addPoliciesToExistingObject(datasourcePolicyMap, datasource);
                return datasourceService.save(updatedDatasource).thenReturn(Boolean.TRUE);
            });
        });
    }

    /**
     * Generates a Map Mono for datasource permissions to list of default application role ids.
     * Datasource permissions are obtained from only APPLICATION_VIEWER from AppsmithRole based on
     * the default roles which exist for the application.
     * <p>
     * Here we are not giving to application developer role, because we are going to introduce another permission on
     * workspace level which will be responsible for giving permission to create actions for all datasource present inside
     * the workspace.
     *
     * @param applicationId
     * @return
     */
    private Mono<Map<String, List<String>>> getMapDatasourcePermissionToDefaultAppRoleIds(String applicationId) {
        return permissionGroupRepository
                .findByDefaultApplicationId(applicationId, Optional.empty())
                .collectList()
                .map(defaultApplicationRoles -> {
                    Map<String, List<String>> mapPermissionToDefaultApplicationRoleId = new HashMap<>();
                    defaultApplicationRoles.forEach(defaultApplicationRole -> {
                        if (defaultApplicationRole.getName().startsWith(FieldName.APPLICATION_VIEWER)) {
                            updatePermissionMapWithDatasourcePermissionForRoleId(
                                    AppsmithRole.APPLICATION_VIEWER,
                                    defaultApplicationRole,
                                    mapPermissionToDefaultApplicationRoleId);
                        }
                    });
                    return mapPermissionToDefaultApplicationRoleId;
                });
    }

    private void updatePermissionMapWithDatasourcePermissionForRoleId(
            AppsmithRole appsmithRole,
            PermissionGroup role,
            Map<String, List<String>> mapPermissionToDefaultApplicationRoleId) {
        appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Datasource.class))
                .forEach(aclPermission -> mapPermissionToDefaultApplicationRoleId.merge(
                        aclPermission.getValue(), List.of(role.getId()), ListUtils::union));
    }

    @Override
    protected boolean isValidActionName(ActionDTO action) {
        boolean isInternal = false;
        if (action.getRootModuleInstanceId() != null) {
            isInternal = true;
        }
        return entityValidationService.validateName(action.getName(), isInternal);
    }

    @Override
    protected void setGitSyncIdInNewAction(NewAction newAction) {
        ActionDTO action = newAction.getUnpublishedAction();
        if (isModuleContext(action.getContextType())) {
            if (newAction.getGitSyncId() == null) {
                newAction.setGitSyncId(action.getModuleId() + "_" + new ObjectId());
            }
        } else {
            super.setGitSyncIdInNewAction(newAction);
        }
    }

    @Override
    public Mono<List<NewAction>> archiveActionsByModuleId(String moduleId) {
        return repository
                .findAllNonJSActionsByModuleId(moduleId)
                .flatMap(repository::archive)
                .onErrorResume(throwable -> {
                    log.error(throwable.getMessage());
                    return Mono.empty();
                })
                .collectList();
    }

    @Override
    public Mono<List<ActionDTO>> archiveActionsByRootModuleInstanceId(String rootModuleInstanceId) {
        return repository
                .findAllByRootModuleInstanceId(
                        rootModuleInstanceId, Optional.of(actionPermission.getDeletePermission()), false)
                .flatMap(newAction -> deleteUnpublishedAction(newAction.getId()))
                .collectList();
    }

    @Override
    public Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode) {
        return repository.findPublicActionByModuleId(moduleId, resourceMode);
    }

    @Override
    public Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInModule(String moduleId) {
        return repository
                .findUnpublishedActionsByModuleIdAndExecuteOnLoadSetByUserTrue(
                        moduleId, actionPermission.getEditPermission())
                .flatMap(this::sanitizeAction);
    }

    @Override
    public Flux<NewAction> findAllUnpublishedComposedActionsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission, boolean includeJs) {
        return repository.findAllByRootModuleInstanceId(
                rootModuleInstanceId, Optional.ofNullable(permission), includeJs);
    }

    @Override
    public Flux<ActionViewDTO> findAllUnpublishedComposedActionViewDTOsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission, boolean includeJs) {
        return repository
                .findAllByRootModuleInstanceId(rootModuleInstanceId, Optional.ofNullable(permission), includeJs)
                .map(newAction -> this.generateActionViewDTO(newAction, newAction.getUnpublishedAction(), false))
                .map(responseUtils::updateActionViewDTOWithDefaultResources);
    }

    @Override
    public Flux<NewAction> findAllJSActionsByCollectionIds(List<String> collectionIds, List<String> projectionFields) {
        return repository.findAllByActionCollectionIdWithoutPermissions(collectionIds, projectionFields);
    }

    @Override
    public Flux<ActionDTO> findAllJSActionsByCollectionIdsAndViewMode(
            List<String> collectionIds, List<String> projectionFields, boolean viewMode) {
        return repository
                .findAllByActionCollectionIdWithoutPermissions(collectionIds, projectionFields)
                .flatMap(newAction -> this.generateActionByViewMode(newAction, viewMode))
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Mono<List<NewAction>> archiveActionsByWorkflowId(String workflowId, Optional<AclPermission> permission) {
        List<String> includeFields = List.of(fieldName(QNewAction.newAction.id));
        return repository
                .findByWorkflowId(workflowId, permission, Optional.of(includeFields), Boolean.FALSE)
                .filter(newAction -> {
                    boolean unpublishedActionNotFromCollection = Objects.isNull(newAction.getUnpublishedAction())
                            || StringUtils.isEmpty(
                                    newAction.getUnpublishedAction().getCollectionId());
                    boolean publishedActionNotFromCollection = Objects.isNull(newAction.getPublishedAction())
                            || StringUtils.isEmpty(
                                    newAction.getPublishedAction().getCollectionId());
                    return unpublishedActionNotFromCollection && publishedActionNotFromCollection;
                })
                .flatMap(repository::archive)
                .collectList();
    }

    @Override
    public Mono<List<BulkWriteResult>> publishActionsForWorkflows(String workflowId, AclPermission aclPermission) {
        Mono<UpdateResult> archiveDeletedUnpublishedActions =
                repository.archiveDeletedUnpublishedActionsForWorkflows(workflowId, aclPermission);
        Mono<List<BulkWriteResult>> publishActionsForWorkflows =
                repository.publishActionsForWorkflows(workflowId, aclPermission);
        return archiveDeletedUnpublishedActions.then(publishActionsForWorkflows);
    }

    @Override
    public Flux<NewAction> findPublicActionsByModuleInstanceId(
            String moduleInstanceId, Optional<AclPermission> permission) {
        return repository.findPublicActionsByModuleInstanceId(moduleInstanceId, permission);
    }

    @Override
    public Mono<Boolean> archiveAllByIdsWithoutPermission(Collection<String> actionIds) {
        if (CollectionUtils.isEmpty(actionIds)) {
            return Mono.just(Boolean.TRUE);
        }
        return repository.archiveAllById(actionIds);
    }

    @Override
    public Flux<NewAction> findAllActionsByContextIdAndContextTypeAndViewMode(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            boolean viewMode,
            boolean includeJs) {
        Flux<NewAction> newActionFlux;
        if (viewMode) {
            newActionFlux = repository.findAllPublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        } else {
            newActionFlux = repository.findAllUnpublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        return newActionFlux
                .flatMap(repository::setUserPermissionsInObject)
                .collectList()
                .flatMapMany(this::addMissingPluginDetailsIntoAllActions);
    }

    @Override
    public Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode) {
        return super.generateActionByViewMode(newAction, viewMode).map(actionDTO -> {
            actionDTO.setIsPublic(newAction.getIsPublic());
            actionDTO.setModuleInstanceId(newAction.getModuleInstanceId());
            actionDTO.setRootModuleInstanceId(newAction.getRootModuleInstanceId());

            DefaultResources defaultResources = newAction.getDefaultResources();
            if (actionDTO.getDefaultResources() != null) {
                actionDTO.getDefaultResources().setModuleInstanceId(defaultResources.getModuleInstanceId());
                actionDTO.getDefaultResources().setRootModuleInstanceId(defaultResources.getRootModuleInstanceId());
            }

            return actionDTO;
        });
    }

    @Override
    public ActionViewDTO generateActionViewDTO(NewAction action, ActionDTO actionDTO, boolean viewMode) {
        ActionViewDTO actionViewDTO = super.generateActionViewDTO(action, actionDTO, viewMode);

        if (action.getRootModuleInstanceId() != null) {
            actionViewDTO.setIsPublic(action.getIsPublic());
            actionViewDTO.setModuleInstanceId(action.getModuleInstanceId());
            actionViewDTO.setRootModuleInstanceId(action.getRootModuleInstanceId());
            if (!viewMode) {
                actionViewDTO.setPluginId(action.getPluginId());
                actionViewDTO.setExecuteOnLoad(actionDTO.getUserSetOnLoad());
                if (!Boolean.TRUE.equals(actionDTO.getUserSetOnLoad())) {
                    actionViewDTO.setExecuteOnLoad(
                            actionDTO.getExecuteOnLoad() != null && actionDTO.getExecuteOnLoad());
                }
            }
        }
        if (StringUtils.isNotBlank(action.getWorkflowId())) {
            actionViewDTO.setWorkflowId(action.getWorkflowId());
        }
        return actionViewDTO;
    }

    @Override
    public Flux<ActionViewDTO> getActionsForViewModeForWorkflow(String workflowId, String branchName) {
        return findAllActionsByContextIdAndContextTypeAndViewMode(
                        workflowId,
                        CreatorContextType.WORKFLOW,
                        actionPermission.getExecutePermission(),
                        Boolean.TRUE,
                        Boolean.FALSE)
                .map(action -> generateActionViewDTO(action, action.getPublishedAction(), Boolean.TRUE));
    }

    @Override
    public Flux<ActionDTO> getUnpublishedActions(
            MultiValueMap<String, String> params, String branchName, Boolean includeJsActions) {
        MultiValueMap<String, String> updatedParams = new LinkedMultiValueMap<>(params);

        Mono<Workflow> workflowMono = StringUtils.isEmpty(params.getFirst(FieldName.WORKFLOW_ID))
                ? Mono.just(new Workflow())
                : workflowRepository
                        .findById(params.getFirst(FieldName.WORKFLOW_ID), workflowPermission.getReadPermission())
                        .switchIfEmpty(Mono.just(new Workflow()));

        return workflowMono.flatMapMany(workflow -> {
            String workflowId = workflow.getId();
            if (!CollectionUtils.isEmpty(updatedParams.get(FieldName.WORKFLOW_ID))
                    && StringUtils.isNotBlank(workflowId)) {
                updatedParams.set(FieldName.WORKFLOW_ID, workflowId);
            }
            return super.getUnpublishedActions(updatedParams, branchName, includeJsActions);
        });
    }

    @Override
    protected Flux<NewAction> getUnpublishedActionsFromRepo(
            MultiValueMap<String, String> params, Boolean includeJsActions) {
        if (params.getFirst(FieldName.WORKFLOW_ID) != null) {
            String workflowId = params.getFirst(FieldName.WORKFLOW_ID);
            return repository.findAllUnpublishedActionsByContextIdAndContextType(
                    workflowId, CreatorContextType.WORKFLOW, actionPermission.getEditPermission(), includeJsActions);
        }
        return super.getUnpublishedActionsFromRepo(params, includeJsActions);
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(NewAction savedAction) {
        ActionDTO unpublishedAction = savedAction.getUnpublishedAction();
        Map<String, Object> analyticsProperties = super.getAnalyticsProperties(savedAction);
        analyticsProperties.put(
                FieldName.WORKFLOW_ID,
                ObjectUtils.defaultIfNull(
                        savedAction.getWorkflowId(), ObjectUtils.defaultIfNull(unpublishedAction.getWorkflowId(), "")));
        return analyticsProperties;
    }

    @Override
    public Flux<NewAction> findByPageIdsForExport(
            List<String> unpublishedPages, Optional<AclPermission> optionalPermission) {
        return super.findByPageIdsForExport(unpublishedPages, optionalPermission)
                .filter(newAction ->
                        newAction.getRootModuleInstanceId() == null || Boolean.TRUE.equals(newAction.getIsPublic()));
    }

    @Override
    public Mono<List<BulkWriteResult>> publishActionsForActionCollection(
            String actionCollectionId, AclPermission aclPermission) {
        Mono<UpdateResult> archiveDeletedUnpublishedActions =
                repository.archiveDeletedUnpublishedActionsForCollection(actionCollectionId, aclPermission);
        Mono<List<BulkWriteResult>> publishActions =
                repository.publishActionsForCollection(actionCollectionId, aclPermission);
        return archiveDeletedUnpublishedActions.then(publishActions);
    }

    @Override
    protected void setCommonFieldsFromNewActionIntoAction(NewAction newAction, ActionDTO action) {
        super.setCommonFieldsFromNewActionIntoAction(newAction, action);

        action.setIsPublic(newAction.getIsPublic());
        action.setModuleInstanceId(newAction.getModuleInstanceId());
        action.setRootModuleInstanceId(newAction.getRootModuleInstanceId());
    }

    @Override
    public void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction) {
        super.setCommonFieldsFromActionDTOIntoNewAction(action, newAction);
        if (isModuleContext(action.getContextType())) {
            newAction.setIsPublic(action.getIsPublic());
            newAction.setRootModuleInstanceId(action.getRootModuleInstanceId());
        } else if (isWorkflowContext(action.getContextType())) {
            newAction.setWorkflowId(action.getWorkflowId());
        }
    }

    @Override
    public Flux<ActionViewDTO> getAllModuleInstanceActionInContext(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            boolean viewMode,
            boolean includeJs) {
        return repository
                .findAllModuleInstanceEntitiesByContextAndViewMode(
                        contextId, contextType, Optional.of(permission), viewMode, includeJs)
                .map(newAction -> {
                    ActionDTO actionDTO;
                    if (viewMode) {
                        actionDTO = newAction.getPublishedAction();
                    } else {
                        actionDTO = newAction.getUnpublishedAction();
                    }
                    return this.generateActionViewDTO(newAction, actionDTO, viewMode);
                })
                .map(responseUtils::updateActionViewDTOWithDefaultResources);
    }

    @Override
    public Mono<Void> saveLastEditInformationInParent(ActionDTO actionDTO) {
        if (isModuleContext(actionDTO.getContextType())) {
            return moduleMetadataService
                    .saveLastEditInformation(actionDTO.getModuleId())
                    .then();
        }
        return super.saveLastEditInformationInParent(actionDTO);
    }
}
