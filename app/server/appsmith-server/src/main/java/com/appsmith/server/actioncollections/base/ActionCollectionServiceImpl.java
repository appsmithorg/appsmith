package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.modules.metadata.ModuleMetadataService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;
import static com.appsmith.server.helpers.ContextTypeUtils.isWorkflowContext;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ResponseUtils responseUtils;
    private final ModuleMetadataService moduleMetadataService;
    private final PolicyGenerator policyGenerator;

    public ActionCollectionServiceImpl(
            Validator validator,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission,
            DefaultResourcesService<ActionCollection> defaultResourcesService,
            ModuleMetadataService moduleMetadataService) {
        super(
                validator,
                repository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                responseUtils,
                applicationPermission,
                actionPermission,
                defaultResourcesService);
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
        this.responseUtils = responseUtils;
        this.moduleMetadataService = moduleMetadataService;
        this.policyGenerator = policyGenerator;
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionsByModuleId(String moduleId) {
        return repository
                .findAllByModuleIds(List.of(moduleId), Optional.of(actionPermission.getDeletePermission()))
                .flatMap(actionCollection -> {
                    Set<String> actionIds = new HashSet<>();
                    actionIds.addAll(actionCollection
                            .getUnpublishedCollection()
                            .getDefaultToBranchedActionIdsMap()
                            .values());

                    Mono<Boolean> archiveAllActionsMono = newActionService
                            .archiveAllByIdsWithoutPermission(actionIds)
                            .onErrorResume(throwable -> {
                                log.error(throwable.getMessage());
                                return Mono.just(Boolean.TRUE);
                            });
                    return archiveAllActionsMono.then(repository.archive(actionCollection));
                })
                .collectList();
    }

    @Override
    public Mono<List<ActionCollectionDTO>> archiveActionCollectionsByRootModuleInstanceId(String rootModuleInstanceId) {
        return repository
                .findAllByRootModuleInstanceId(rootModuleInstanceId, null, Optional.empty())
                .flatMap(actionCollection -> deleteUnpublishedActionCollection(actionCollection.getId()))
                .collectList();
    }

    @Override
    public Flux<ActionCollection> findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission) {
        return repository.findAllByRootModuleInstanceId(rootModuleInstanceId, null, Optional.ofNullable(permission));
    }

    @Override
    public Flux<ActionCollectionDTO> findAllUnpublishedComposedActionCollectionDTOsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission) {
        return repository
                .findAllByRootModuleInstanceId(rootModuleInstanceId, null, Optional.ofNullable(permission))
                .flatMap(actionCollection -> this.generateActionCollectionByViewMode(actionCollection, false))
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionByWorkflowId(
            String workflowId, Optional<AclPermission> permission) {
        List<String> includeFields = List.of(
                ActionCollection.Fields.id,
                ActionCollection.Fields.publishedCollection,
                ActionCollection.Fields.unpublishedCollection);
        return repository
                .findByWorkflowId(workflowId, permission, Optional.of(includeFields))
                .flatMap(actionCollection -> {
                    Set<String> actionIds = new HashSet<>();
                    actionIds.addAll(actionCollection
                            .getUnpublishedCollection()
                            .getDefaultToBranchedActionIdsMap()
                            .values());
                    if (actionCollection.getPublishedCollection() != null
                            && !CollectionUtils.isEmpty(
                                    actionCollection.getPublishedCollection().getDefaultToBranchedActionIdsMap())) {
                        actionIds.addAll(actionCollection
                                .getPublishedCollection()
                                .getDefaultToBranchedActionIdsMap()
                                .values());
                    }

                    Mono<Boolean> archiveAllActionsMono = newActionService
                            .archiveAllByIdsWithoutPermission(actionIds)
                            .onErrorResume(throwable -> {
                                log.error(throwable.getMessage());
                                return Mono.just(Boolean.TRUE);
                            });

                    return archiveAllActionsMono.then(repository.archive(actionCollection));
                })
                .collectList();
    }

    @Override
    protected Flux<ActionCollection> getActionCollectionsFromRepoByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        if (params.getFirst(FieldName.WORKFLOW_ID) != null) {
            String workflowId = params.getFirst(FieldName.WORKFLOW_ID);
            return getActionsCollectionsForWorkflowId(workflowId, viewMode);
        }
        return super.getActionCollectionsFromRepoByViewMode(params, viewMode);
    }

    private Flux<ActionCollection> getActionsCollectionsForWorkflowId(String workflowId, Boolean viewMode) {
        Flux<ActionCollection> workflowActionsFromRepository;

        if (viewMode) {
            workflowActionsFromRepository = repository.findAllPublishedActionCollectionsByContextIdAndContextType(
                    workflowId, CreatorContextType.WORKFLOW, actionPermission.getEditPermission());
        } else {
            workflowActionsFromRepository = repository.findAllUnpublishedActionCollectionsByContextIdAndContextType(
                    workflowId, CreatorContextType.WORKFLOW, actionPermission.getEditPermission());
        }
        return workflowActionsFromRepository;
    }

    @Override
    public Mono<List<ActionCollection>> publishActionCollectionsForWorkflow(
            String workflowId, AclPermission aclPermission) {
        Mono<Void> archiveDeletedUnpublishedActionsCollectionsMono =
                repository.archiveDeletedUnpublishedActionsCollectionsForWorkflows(workflowId, aclPermission);

        Mono<List<ActionCollection>> publishActionCollectionsAndChildActionsMono = repository
                .findAllUnpublishedActionCollectionsByContextIdAndContextType(
                        workflowId, CreatorContextType.WORKFLOW, aclPermission)
                .flatMap(collection -> {
                    // Publish the collection by copying the unpublished collectionDTO to published collectionDTO
                    collection.setPublishedCollection(collection.getUnpublishedCollection());
                    return newActionService
                            .publishActionsForActionCollection(collection.getId(), aclPermission)
                            .then(this.save(collection));
                })
                .collectList();
        return archiveDeletedUnpublishedActionsCollectionsMono.then(publishActionCollectionsAndChildActionsMono);
    }

    @Override
    public Flux<ActionCollectionViewDTO> getActionCollectionsForViewModeForWorkflow(
            String workflowId, String branchName) {
        return repository
                .findAllPublishedActionCollectionsByContextIdAndContextType(
                        workflowId, CreatorContextType.WORKFLOW, actionPermission.getExecutePermission())
                .flatMap(this::generateActionCollectionViewDTO);
    }

    @Override
    public Mono<ActionCollectionViewDTO> generateActionCollectionViewDTO(ActionCollection actionCollection) {
        return super.generateActionCollectionViewDTO(actionCollection).map(actionCollectionViewDTO -> {
            actionCollectionViewDTO.setPackageId(actionCollection.getPackageId());
            if (StringUtils.isNotBlank(actionCollection.getWorkflowId())) {
                actionCollectionViewDTO.setWorkflowId(actionCollection.getWorkflowId());
            }
            return actionCollectionViewDTO;
        });
    }

    @Override
    protected void setGitSyncIdInActionCollection(ActionCollection collection) {
        if (isModuleContext(collection.getUnpublishedCollection().getContextType())) {
            if (collection.getGitSyncId() == null) {
                collection.setGitSyncId(collection.getUnpublishedCollection().getModuleId() + "_" + new ObjectId());
            }
        } else if (isWorkflowContext(collection.getContextType())) {
            if (collection.getGitSyncId() == null) {
                collection.setGitSyncId(collection.getWorkflowId() + "_" + new ObjectId());
            }
        } else {
            super.setGitSyncIdInActionCollection(collection);
        }
    }

    @Override
    public Flux<ActionCollectionDTO> getAllModuleInstanceCollectionsInContext(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode) {
        return repository
                .findAllModuleInstanceEntitiesByContextAndViewMode(
                        contextId, contextType, Optional.of(permission), viewMode)
                .flatMap(actionCollection -> generateActionCollectionByViewMode(actionCollection, viewMode))
                .map(responseUtils::updateCollectionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionCollectionDTO> getPublicActionCollection(String moduleId, ResourceModes resourceMode) {
        return repository
                .findPublicActionCollectionByModuleId(moduleId, resourceMode)
                .flatMap(actionCollection -> generateActionCollectionByViewMode(
                                actionCollection, ResourceModes.VIEW == resourceMode)
                        .flatMap(actionCollectionDTO -> populateActionCollectionByViewMode(
                                actionCollectionDTO, ResourceModes.VIEW == resourceMode)));
    }

    @Override
    public void generateAndSetPolicies(ModuleInstance moduleInstance, ActionCollection actionCollection) {
        if (moduleInstance == null) {
            throw new AppsmithException(
                    AppsmithError.INTERNAL_SERVER_ERROR, "No module instance found to copy policies from.");
        }
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(
                moduleInstance.getPolicies(), ModuleInstance.class, NewAction.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public void generateAndSetPolicies(Module module, ActionCollection actionCollection) {
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, NewAction.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public Mono<Void> saveLastEditInformationInParent(ActionCollectionDTO actionCollectionDTO) {
        if (isModuleContext(actionCollectionDTO.getContextType())) {
            return moduleMetadataService
                    .saveLastEditInformation(actionCollectionDTO.getModuleId())
                    .then();
        }
        return super.saveLastEditInformationInParent(actionCollectionDTO);
    }
}
