package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;

    public ActionCollectionServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                responseUtils,
                applicationPermission,
                actionPermission);
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
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
                .findAllByRootModuleInstanceIds(List.of(rootModuleInstanceId), Optional.empty())
                .flatMap(actionCollection -> deleteUnpublishedActionCollection(actionCollection.getId()))
                .collectList();
    }

    @Override
    public Flux<ActionCollection> findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission) {
        return repository.findAllByRootModuleInstanceIds(List.of(rootModuleInstanceId), Optional.of(permission));
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionByWorkflowId(
            String workflowId, Optional<AclPermission> permission) {
        List<String> includeFields = List.of(
                fieldName(QActionCollection.actionCollection.id),
                fieldName(QActionCollection.actionCollection.publishedCollection),
                fieldName(QActionCollection.actionCollection.unpublishedCollection));
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
        return repository
                .findAllUnpublishedActionCollectionsByContextIdAndContextType(
                        workflowId, CreatorContextType.WORKFLOW, aclPermission)
                .flatMap(collection -> {
                    // If the collection was deleted in edit mode, now this can be safely deleted from the repository
                    if (collection.getUnpublishedCollection().getDeletedAt() != null) {
                        return this.archiveById(collection.getId()).then(Mono.empty());
                    }
                    // Publish the collection by copying the unpublished collectionDTO to published collectionDTO
                    collection.setPublishedCollection(collection.getUnpublishedCollection());
                    return this.save(collection);
                })
                .collectList();
    }
}
