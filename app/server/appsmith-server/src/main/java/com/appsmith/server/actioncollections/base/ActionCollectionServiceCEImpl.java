package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.cakes.ActionCollectionRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.external.constants.spans.ActionCollectionSpan.GET_ACTION_COLLECTION_BY_ID;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;
import static java.lang.Boolean.TRUE;

@Slf4j
public class ActionCollectionServiceCEImpl
        extends BaseService<ActionCollectionRepository, ActionCollectionRepositoryCake, ActionCollection, String>
        implements ActionCollectionServiceCE {

    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;
    private final ActionPermission actionPermission;
    private final ObservationRegistry observationRegistry;

    @Autowired
    public ActionCollectionServiceCEImpl(
            Validator validator,
            ActionCollectionRepository repositoryDirect,
            ActionCollectionRepositoryCake repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry) {

        super(validator, repositoryDirect, repository, analyticsService);
        this.newActionService = newActionService;
        this.policyGenerator = policyGenerator;
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
        this.actionPermission = actionPermission;
        this.observationRegistry = observationRegistry;
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, Sort sort) {
        return repository
                .findByApplicationId(applicationId, permission, sort)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(collection -> {
                    if (Boolean.TRUE.equals(viewMode)) {
                        // In case we are trying to fetch published actions but this action has not been published, do
                        // not return
                        if (collection.getPublishedCollection() == null) {
                            return Mono.empty();
                        }
                    }
                    // No need to handle the edge case of unpublished action not being present. This is not possible
                    // because every created action starts from an unpublishedAction state.

                    return Mono.just(collection);
                });
    }

    @Override
    public void generateAndSetPolicies(NewPage page, ActionCollection actionCollection) {
        Set<Policy> documentPolicies =
                policyGenerator.getAllChildPolicies(page.getPolicies(), NewPage.class, NewAction.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionCollection> save(ActionCollection collection) {
        setGitSyncIdInActionCollection(collection);
        return repository.save(collection);
    }

    protected void setGitSyncIdInActionCollection(ActionCollection collection) {
        if (collection.getGitSyncId() == null) {
            collection.setGitSyncId(collection.getApplicationId() + "_" + UUID.randomUUID());
        }
    }

    @Override
    public Flux<ActionCollection> saveAll(List<ActionCollection> collections) {
        collections.forEach(collection -> {
            setGitSyncIdInActionCollection(collection);
        });
        return repository.saveAll(collections);
    }

    @Override
    public Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        return this.getNonComposedActionCollectionsByViewMode(params, viewMode)
                .flatMap(actionCollectionDTO -> this.populateActionCollectionByViewMode(actionCollectionDTO, viewMode));
    }

    @Override
    public Mono<ActionCollectionDTO> populateActionCollectionByViewMode(
            ActionCollectionDTO actionCollectionDTO1, Boolean viewMode) {
        return newActionService
                .findByCollectionIdAndViewMode(
                        actionCollectionDTO1.getId(), viewMode, actionPermission.getReadPermission())
                .map(action -> newActionService.generateActionByViewMode(action, false))
                .collectList()
                .flatMap(actionsList -> splitValidActionsByViewMode(actionCollectionDTO1, actionsList, viewMode));
    }

    /**
     * This method splits the actions associated to an action collection into valid and archived actions
     */
    @Override
    public Mono<ActionCollectionDTO> splitValidActionsByViewMode(
            ActionCollectionDTO actionCollectionDTO, List<ActionDTO> actionsList, Boolean viewMode) {
        return Mono.just(actionCollectionDTO).map(actionCollectionDTO1 -> {
            final List<String> collect = actionsList.stream()
                    .parallel()
                    .map(ActionDTO::getPluginId)
                    .distinct()
                    .toList();
            if (collect.size() == 1) {
                actionCollectionDTO.setPluginId(collect.get(0));
                actionCollectionDTO.setPluginType(actionsList.get(0).getPluginType());
            }
            List<ActionDTO> validActionList = new ArrayList<>(actionsList);
            actionCollectionDTO.setActions(validActionList);
            return actionCollectionDTO;
        });
    }

    // TODO Nidhi do we need the direct controller call? If not, this can be deleted
    @Override
    public Flux<ActionCollectionViewDTO> getActionCollectionsForViewMode(String applicationId, String branchName) {
        if (applicationId == null || applicationId.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getReadPermission())
                .flatMapMany(branchedApplicationId -> repository
                        .findNonComposedByApplicationIdAndViewMode(
                                branchedApplicationId, true, actionPermission.getExecutePermission())
                        .flatMap(this::generateActionCollectionViewDTO));
    }

    @Override
    public Flux<ActionCollectionViewDTO> getActionCollectionsForViewMode(String branchedApplicationId) {
        return repository
                .findNonComposedByApplicationIdAndViewMode(
                        branchedApplicationId, true, actionPermission.getExecutePermission())
                .flatMap(this::generateActionCollectionViewDTO);
    }

    @Override
    public Mono<ActionCollectionViewDTO> generateActionCollectionViewDTO(ActionCollection actionCollection) {
        return generateActionCollectionViewDTO(actionCollection, actionPermission.getExecutePermission(), true);
    }

    protected Mono<ActionCollectionViewDTO> generateActionCollectionViewDTO(
            ActionCollection actionCollection, AclPermission aclPermission, boolean viewMode) {
        ActionCollectionDTO actionCollectionDTO = null;
        if (viewMode) {
            actionCollectionDTO = actionCollection.getPublishedCollection();
        } else {
            actionCollectionDTO = actionCollection.getUnpublishedCollection();
        }
        if (Objects.isNull(actionCollectionDTO)) {
            return Mono.empty();
        }
        ActionCollectionViewDTO actionCollectionViewDTO = new ActionCollectionViewDTO();
        actionCollectionViewDTO.setId(actionCollection.getId());
        actionCollectionViewDTO.setBaseId(actionCollection.getBaseId());
        actionCollectionViewDTO.setName(actionCollectionDTO.getName());
        actionCollectionViewDTO.setPageId(actionCollectionDTO.getPageId());
        actionCollectionViewDTO.setApplicationId(actionCollection.getApplicationId());
        actionCollectionViewDTO.setVariables(actionCollectionDTO.getVariables());
        actionCollectionViewDTO.setBody(actionCollectionDTO.getBody());

        return newActionService
                .findByCollectionIdAndViewMode(actionCollection.getId(), viewMode, aclPermission)
                .map(action -> newActionService.generateActionByViewMode(action, viewMode))
                .collectList()
                .map(actionDTOList -> {
                    actionCollectionViewDTO.setActions(actionDTOList);
                    return actionCollectionViewDTO;
                });
    }

    @Override
    public Flux<ActionCollectionDTO> getNonComposedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        if (params == null || viewMode == null) {
            return Flux.empty();
        }
        return getNonComposedActionCollectionsFromRepoByViewMode(params, viewMode)
                .flatMap(actionCollection -> generateActionCollectionByViewMode(actionCollection, viewMode));
    }

    protected Flux<ActionCollection> getNonComposedActionCollectionsFromRepoByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode) {
        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            // Fetch unpublished pages because GET actions is only called during edit mode. For view mode, different
            // function call is made which takes care of returning only the essential fields of an action
            return applicationService
                    .findBranchedApplicationId(
                            params.getFirst(FieldName.BRANCH_NAME),
                            params.getFirst(FieldName.APPLICATION_ID),
                            applicationPermission.getReadPermission())
                    .flatMapMany(childApplicationId -> repository.findNonComposedByApplicationIdAndViewMode(
                            childApplicationId, viewMode, actionPermission.getReadPermission()));
        }
        String pageId = null;

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            pageId = params.getFirst(FieldName.PAGE_ID);
        }
        return repository.findAllNonComposedByPageIdAndViewMode(pageId, viewMode, actionPermission.getReadPermission());
    }

    @Override
    public Mono<ActionCollectionDTO> update(String id, ActionCollectionDTO actionCollectionDTO) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id, actionPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        return actionCollectionMono
                .map(dbActionCollection -> {
                    copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                    return dbActionCollection;
                })
                .flatMap(actionCollection -> this.update(id, actionCollection))
                .zipWith(ReactiveContextUtils.getCurrentUser())
                .flatMap(tuple -> repository.setUserPermissionsInObject(tuple.getT1(), tuple.getT2()))
                .flatMap(actionCollection -> this.generateActionCollectionByViewMode(actionCollection, false)
                        .flatMap(actionCollectionDTO1 -> this.populateActionCollectionByViewMode(
                                actionCollection.getUnpublishedCollection(), false))); // */
    }

    @Override
    public Mono<ActionCollectionDTO> deleteWithoutPermissionUnpublishedActionCollection(String id) {
        return deleteUnpublishedActionCollection(id, null, actionPermission.getDeletePermission());
    }

    @Override
    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id) {
        return deleteUnpublishedActionCollection(
                id, actionPermission.getDeletePermission(), actionPermission.getDeletePermission());
    }

    @Override
    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(
            String id, AclPermission permission, AclPermission deleteActionPermission) {
        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id, permission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)));
        return actionCollectionMono
                .flatMap(toDelete -> {
                    Mono<ActionCollection> modifiedActionCollectionMono;

                    if (toDelete.getPublishedCollection() != null
                            && toDelete.getPublishedCollection().getName() != null) {
                        toDelete.getUnpublishedCollection().setDeletedAt(Instant.now());
                        modifiedActionCollectionMono = newActionService
                                .findByCollectionIdAndViewMode(id, false, deleteActionPermission)
                                .flatMap(newAction -> newActionService
                                        .deleteGivenNewAction(newAction)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to delete action with id {} for collection: {}",
                                                    newAction.getId(),
                                                    toDelete.getUnpublishedCollection()
                                                            .getName());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .collectList()
                                .then(repository.save(toDelete))
                                .flatMap(modifiedActionCollection -> {
                                    return analyticsService.sendArchiveEvent(
                                            modifiedActionCollection, getAnalyticsProperties(modifiedActionCollection));
                                });
                    } else {
                        // This actionCollection was never published. This document can be safely archived
                        modifiedActionCollectionMono = this.archiveById(toDelete.getId());
                    }

                    return modifiedActionCollectionMono;
                })
                .flatMap(updatedAction -> generateActionCollectionByViewMode(updatedAction, false)); // */
    }

    @Override
    public Mono<ActionCollectionDTO> generateActionCollectionByViewMode(
            ActionCollection actionCollection, Boolean viewMode) {
        ActionCollectionDTO actionCollectionDTO = null;

        if (TRUE.equals(viewMode)) {
            if (actionCollection.getPublishedCollection() != null) {
                actionCollectionDTO = actionCollection.getPublishedCollection();
            } else {
                // We are trying to fetch published action but it doesnt exist because the action hasn't been published
                // yet
                return Mono.empty();
            }
        } else {
            if (actionCollection.getUnpublishedCollection() != null) {
                actionCollectionDTO = actionCollection.getUnpublishedCollection();
            }
        }

        assert actionCollectionDTO != null;
        actionCollectionDTO.populateTransientFields(actionCollection);

        return Mono.just(actionCollectionDTO);
    }

    @Override
    public Mono<ActionCollection> findById(String id, AclPermission aclPermission) {
        return repository
                .findById(id, aclPermission)
                .name(GET_ACTION_COLLECTION_BY_ID)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<ActionCollectionDTO> findActionCollectionDTObyIdAndViewMode(
            String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission)
                .flatMap(action -> this.generateActionCollectionByViewMode(action, viewMode));
    }

    @Override
    public Mono<List<ActionCollection>> archiveActionCollectionByApplicationId(
            String applicationId, AclPermission permission) {
        return repository
                .findByApplicationId(applicationId, permission, null)
                .flatMap(this::archiveGivenActionCollection)
                .collectList();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId) {
        return repository.findByPageId(pageId);
    }

    @Override
    public Flux<ActionCollectionDTO> getCollectionsByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission) {
        return repository
                .findByPageIdAndViewMode(pageId, viewMode, permission)
                .flatMap(actionCollection -> generateActionCollectionByViewMode(actionCollection, viewMode));
    }

    @Override
    public Flux<ActionCollection> findByPageIdsForExport(List<String> pageIds, AclPermission permission) {
        return repository.findByPageIds(pageIds, permission).doOnNext(actionCollection -> {
            actionCollection.getUnpublishedCollection().populateTransientFields(actionCollection);
            if (actionCollection.getPublishedCollection() != null
                    && StringUtils.hasText(
                            actionCollection.getPublishedCollection().getName())) {
                actionCollection.getPublishedCollection().populateTransientFields(actionCollection);
            }
        });
    }

    @Override
    public Mono<ActionCollection> archiveById(String id) {
        Mono<ActionCollection> actionCollectionMono = repository
                .findById(id)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();
        return actionCollectionMono.flatMap(this::archiveGivenActionCollection);
    }

    protected Mono<ActionCollection> archiveGivenActionCollection(ActionCollection actionCollection) {
        Flux<NewAction> unpublishedJsActionsFlux = newActionService.findByCollectionIdAndViewMode(
                actionCollection.getId(), false, actionPermission.getDeletePermission());
        Flux<NewAction> publishedJsActionsFlux = newActionService.findByCollectionIdAndViewMode(
                actionCollection.getId(), true, actionPermission.getDeletePermission());
        return unpublishedJsActionsFlux
                .mergeWith(publishedJsActionsFlux)
                .flatMap(toArchive -> newActionService
                        .archiveGivenNewAction(toArchive)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug(
                                    "Failed to delete action with id {} for collection with id: {}",
                                    toArchive.getId(),
                                    actionCollection.getId());
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .collectList()
                .then(repository.archive(actionCollection).thenReturn(actionCollection))
                .flatMap(deletedActionCollection -> analyticsService.sendDeleteEvent(
                        deletedActionCollection, getAnalyticsProperties(deletedActionCollection))); // */
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(ActionCollection savedActionCollection) {
        final ActionCollectionDTO unpublishedCollection = savedActionCollection.getUnpublishedCollection();
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("actionCollectionName", ObjectUtils.defaultIfNull(unpublishedCollection.getName(), ""));
        analyticsProperties.put(
                "applicationId", ObjectUtils.defaultIfNull(savedActionCollection.getApplicationId(), ""));
        analyticsProperties.put("pageId", ObjectUtils.defaultIfNull(unpublishedCollection.getPageId(), ""));
        analyticsProperties.put("orgId", ObjectUtils.defaultIfNull(savedActionCollection.getWorkspaceId(), ""));
        return analyticsProperties;
    }

    @Override
    public Mono<ActionCollection> create(ActionCollection collection) {
        setGitSyncIdInActionCollection(collection);
        return super.create(collection);
    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode) {
        if (viewMode) {
            return repository.findAllPublishedActionCollectionsByContextIdAndContextType(
                    contextId, contextType, permission);
        }
        return repository.findAllUnpublishedActionCollectionsByContextIdAndContextType(
                contextId, contextType, permission);
    }

    protected Mono<ActionDTO> createJsAction(ActionCollection actionCollection, ActionDTO action) {
        ActionCollectionDTO collectionDTO = actionCollection.getUnpublishedCollection();

        /**
         * If the Datasource is null, create one and set the autoGenerated flag to true. This is required because spring-data
         * cannot add the createdAt and updatedAt properties for null embedded objects. At this juncture, we couldn't find
         * a way to disable the auditing for nested objects.
         *
         */
        if (action.getDatasource() == null) {
            action.autoGenerateDatasource();
        }
        action.getDatasource().setWorkspaceId(collectionDTO.getWorkspaceId());
        action.getDatasource().setPluginId(collectionDTO.getPluginId());
        action.getDatasource().setName(FieldName.UNUSED_DATASOURCE);

        // Make sure that the proper values are used for the new action
        // Scope the actions' fully qualified names by collection name
        action.setFullyQualifiedName(collectionDTO.getName() + "." + action.getName());
        action.setPageId(collectionDTO.getPageId());
        action.setPluginType(collectionDTO.getPluginType());
        action.setApplicationId(actionCollection.getApplicationId());

        // Action doesn't exist. Create now.
        NewAction newAction = newActionService.generateActionDomain(action);
        newAction.setUnpublishedAction(action);

        Set<Policy> actionCollectionPolicies = new HashSet<>();
        Set<Policy> existingPolicies =
                actionCollection.getPolicies() == null ? Set.of() : actionCollection.getPolicies();
        existingPolicies.forEach(policy -> {
            Policy actionPolicy = new Policy();
            actionPolicy.setPermission(policy.getPermission());
            actionPolicy.setPermissionGroups(policy.getPermissionGroups());
            actionCollectionPolicies.add(actionPolicy);
        });

        newAction.setPolicies(actionCollectionPolicies);
        newActionService.setCommonFieldsFromActionDTOIntoNewAction(action, newAction);
        newAction.setRefType(actionCollection.getRefType());
        newAction.setRefName(actionCollection.getRefName());

        Mono<NewAction> sendAnalyticsMono =
                analyticsService.sendCreateEvent(newAction, newActionService.getAnalyticsProperties(newAction));

        return newActionService
                .validateAndSaveActionToRepository(newAction)
                .flatMap(savedAction -> sendAnalyticsMono.thenReturn(savedAction));
    }

    @Override
    public Mono<ActionCollectionDTO> validateAndSaveCollection(ActionCollection actionCollection) {
        ActionCollectionDTO collectionDTO = actionCollection.getUnpublishedCollection();

        return validateActionCollection(actionCollection)
                .thenReturn(collectionDTO.getActions())
                .defaultIfEmpty(List.of())
                .flatMapMany(Flux::fromIterable)
                .flatMap(action -> {
                    if (action.getId() == null) {
                        return createJsAction(actionCollection, action);
                    }
                    // This would occur when the new collection is created by grouping existing actions
                    // This could be a future enhancement for js editor templates,
                    // but is also useful for generic collections
                    // We do not expect to have to update the action at this point
                    return Mono.just(action);
                })
                .collectList()
                .flatMap(actions -> {
                    // Create collection and return with actions
                    final Mono<ActionCollection> actionCollectionMono = this.create(actionCollection)
                            .flatMap(savedActionCollection -> {
                                if (StringUtils.hasLength(savedActionCollection.getBaseId())) {
                                    return Mono.just(savedActionCollection);
                                }
                                // If the base collection is not set then current collection will be the default one
                                savedActionCollection.setBaseId(savedActionCollection.getId());
                                // With PG, this `save` method is returning a different object than what was passed
                                // to it.
                                return this.save(savedActionCollection);
                            })
                            .zipWith(ReactiveContextUtils.getCurrentUser())
                            .flatMap(tuple -> repository.setUserPermissionsInObject(tuple.getT1(), tuple.getT2()))
                            .cache();

                    return actionCollectionMono
                            .map(actionCollection1 -> {
                                actions.forEach(actionDTO -> {
                                    // Update all the actions in the list to belong to this collection
                                    actionDTO.setCollectionId(actionCollection1.getId());
                                });
                                return actions;
                            })
                            .flatMapMany(Flux::fromIterable)
                            .collectList()
                            .zipWith(actionCollectionMono)
                            .flatMap(tuple1 -> {
                                final List<ActionDTO> actionDTOList = tuple1.getT1();
                                final ActionCollection actionCollection1 = tuple1.getT2();
                                return generateActionCollectionByViewMode(actionCollection1, false)
                                        .flatMap(actionCollectionDTO -> splitValidActionsByViewMode(
                                                actionCollection1.getUnpublishedCollection(), actionDTOList, false));
                            });
                });
    }

    private Mono<ActionCollection> validateActionCollection(ActionCollection actionCollection) {
        ActionCollectionDTO collectionDTO = actionCollection.getUnpublishedCollection();

        collectionDTO.populateTransientFields(actionCollection);

        final Set<String> validationMessages = collectionDTO.validate();
        if (!validationMessages.isEmpty()) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_ACTION_COLLECTION, collectionDTO.getName(), validationMessages.toString()));
        }

        return Mono.just(actionCollection);
    }

    @Override
    public Mono<Void> bulkValidateAndInsertActionCollectionInRepository(List<ActionCollection> actionCollectionList) {
        return Flux.fromIterable(actionCollectionList)
                .flatMap(this::validateActionCollection)
                .collectList()
                .flatMap(items -> repository.bulkInsert(repository, items));
    }

    @Override
    public Mono<Void> bulkValidateAndUpdateActionCollectionInRepository(List<ActionCollection> actionCollectionList) {
        return Flux.fromIterable(actionCollectionList)
                .flatMap(this::validateActionCollection)
                .collectList()
                .flatMap(items -> repository.bulkUpdate(repository, items));
    }

    @Override
    public Mono<Void> saveLastEditInformationInParent(ActionCollectionDTO actionCollectionDTO) {
        // Do nothing as this is already taken care for JS objects in the context of page
        return Mono.empty().then();
    }
}
