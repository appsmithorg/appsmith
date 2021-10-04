package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends BaseService<ActionCollectionRepository, ActionCollection, String> implements ActionCollectionService {

    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;

    @Autowired
    public ActionCollectionServiceImpl(Scheduler scheduler,
                                       Validator validator,
                                       MongoConverter mongoConverter,
                                       ReactiveMongoTemplate reactiveMongoTemplate,
                                       ActionCollectionRepository repository,
                                       AnalyticsService analyticsService,
                                       NewActionService newActionService,
                                       PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.newActionService = newActionService;
        this.policyGenerator = policyGenerator;
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort) {
        return repository.findByApplicationIdAndViewMode(applicationId, viewMode, permission)
                // In case of view mode being true, filter out all the actions which haven't been published
                .flatMap(collection -> {
                    if (Boolean.TRUE.equals(viewMode)) {
                        // In case we are trying to fetch published actions but this action has not been published, do not return
                        if (collection.getPublishedCollection() == null) {
                            return Mono.empty();
                        }
                    }
                    // No need to handle the edge case of unpublished action not being present. This is not possible because
                    // every created action starts from an unpublishedAction state.

                    return Mono.just(collection);
                });
    }


    @Override
    public void generateAndSetPolicies(NewPage page, ActionCollection actionCollection) {
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public Mono<ActionCollection> save(ActionCollection collection) {
        return repository.save(collection);
    }

    @Override
    public Flux<ActionCollection> saveAll(List<ActionCollection> collections) {
        return repository.saveAll(collections);
    }

    @Override
    public Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode) {
        return this.getActionCollectionsByViewMode(params, viewMode)
                .flatMap(actionCollectionDTO -> this.populateActionCollectionByViewMode(actionCollectionDTO, viewMode));

    }

    @Override
    public Mono<ActionCollectionDTO> populateActionCollectionByViewMode(ActionCollectionDTO actionCollectionDTO1, Boolean viewMode) {
        return Mono.just(actionCollectionDTO1)
                .flatMap(actionCollectionDTO -> Flux.fromIterable(actionCollectionDTO.getActionIds())
                        .mergeWith(Flux.fromIterable(actionCollectionDTO.getArchivedActionIds()))
                        .flatMap(actionId -> {
                            return newActionService.findActionDTObyIdAndViewMode(actionId, viewMode, READ_ACTIONS);
                        })
                        .collectList()
                        .flatMap(actionsList -> splitValidActionsByViewMode(actionCollectionDTO, actionsList, viewMode)));
    }

    /**
     * This method splits the actions associated to an action collection into valid and archived actions
     */
    @Override
    public Mono<ActionCollectionDTO> splitValidActionsByViewMode(ActionCollectionDTO actionCollectionDTO, List<ActionDTO> actionsList, Boolean viewMode) {
        return Mono.just(actionCollectionDTO)
                .map(actionCollectionDTO1 -> {
                    List<ActionDTO> archivedActionList = new ArrayList<>();
                    List<ActionDTO> validActionList = new ArrayList<>();
                    final List<String> collect = actionsList
                            .stream()
                            .parallel()
                            .map(ActionDTO::getPluginId)
                            .distinct()
                            .collect(Collectors.toList());
                    if (collect.size() == 1) {
                        actionCollectionDTO.setPluginId(collect.get(0));
                        actionCollectionDTO.setPluginType(actionsList.get(0).getPluginType());
                    }
                    actionsList.forEach(action -> {
                        if (action.getArchivedAt() == null) {
                            validActionList.add(action);
                        } else {
                            archivedActionList.add(action);
                        }
                    });
                    actionCollectionDTO.setActions(validActionList);
                    if (Boolean.FALSE.equals(viewMode)) {
                        actionCollectionDTO.setArchivedActions(archivedActionList);
                    }
                    return actionCollectionDTO;
                });
    }

    @Override
    public Flux<ActionCollectionDTO> getActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode) {
        if (params == null || viewMode == null) {
            return Flux.empty();
        }
        if (params.getFirst(FieldName.APPLICATION_ID) != null) {
            // Fetch unpublished pages because GET actions is only called during edit mode. For view mode, different
            // function call is made which takes care of returning only the essential fields of an action
            return repository
                    .findByApplicationIdAndViewMode(params.getFirst(FieldName.APPLICATION_ID), viewMode, READ_ACTIONS)
                    .flatMap(actionCollection ->
                            generateActionCollectionByViewMode(actionCollection, viewMode));
        }

        String name = null;
        List<String> pageIds = new ArrayList<>();

        // In the edit mode, the actions should be displayed in the order they were created.
        Sort sort = Sort.by(FieldName.CREATED_AT);

        if (params.getFirst(FieldName.NAME) != null) {
            name = params.getFirst(FieldName.NAME);
        }

        if (params.getFirst(FieldName.PAGE_ID) != null) {
            pageIds.add(params.getFirst(FieldName.PAGE_ID));
        }
        return repository.findAllActionCollectionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode, READ_ACTIONS, sort)
                .flatMap(actionCollection ->
                        generateActionCollectionByViewMode(actionCollection, viewMode));
    }

    @Override
    public Mono<ActionCollectionDTO> update(String id, ActionCollectionDTO actionCollectionDTO) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> actionCollectionMono = repository.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        return actionCollectionMono
                .map(dbActionCollection -> {
                    copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                    return dbActionCollection;
                })
                .flatMap(actionCollection -> this.update(id, actionCollection))
                .flatMap(actionCollection -> this.generateActionCollectionByViewMode(actionCollection, false)
                        .flatMap(actionCollectionDTO1 -> this.populateActionCollectionByViewMode(
                                actionCollection.getUnpublishedCollection(),
                                false)));
    }

    @Override
    public Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id) {
        Mono<ActionCollection> actionCollectionMono = repository.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)));
        return actionCollectionMono
                .flatMap(toDelete -> {
                    Mono<ActionCollection> modifiedActionCollectionMono;

                    if (toDelete.getPublishedCollection() != null) {
                        toDelete.getUnpublishedCollection().setDeletedAt(Instant.now());
                        modifiedActionCollectionMono = Flux
                                .fromIterable(toDelete.getUnpublishedCollection().getActionIds())
                                .flatMap(actionId -> newActionService.deleteUnpublishedAction(actionId)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug("Failed to delete action with id {} for collection: {}", actionId, toDelete.getUnpublishedCollection().getName());
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .collectList()
                                .then(repository.save(toDelete));
                    } else {
                        // This action was never published. This can be safely deleted from the db
                        modifiedActionCollectionMono = this.delete(id);
                    }

                    return modifiedActionCollectionMono;
                })
                .flatMap(analyticsService::sendDeleteEvent)
                .flatMap(updatedAction -> generateActionCollectionByViewMode(updatedAction, false));
    }

    @Override
    public Mono<ActionCollectionDTO> generateActionCollectionByViewMode(ActionCollection actionCollection, Boolean viewMode) {
        ActionCollectionDTO actionCollectionDTO = null;

        if (TRUE.equals(viewMode)) {
            if (actionCollection.getPublishedCollection() != null) {
                actionCollectionDTO = actionCollection.getPublishedCollection();
            } else {
                // We are trying to fetch published action but it doesnt exist because the action hasn't been published yet
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
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<ActionCollectionDTO> findActionCollectionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission) {
        return this.findById(id, permission)
                .flatMap(action -> this.generateActionCollectionByViewMode(action, viewMode));
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId, AclPermission permission) {
        return repository.findByPageId(pageId, permission);
    }

    @Override
    public Mono<ActionCollection> delete(String id) {
        Mono<ActionCollection> actionCollectionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .cache();
        return actionCollectionMono
                .map(actionCollection -> {
                    final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                    final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
                    final Set<String> actionIds = new HashSet<>();
                    if (unpublishedCollection != null) {
                        actionIds.addAll(unpublishedCollection.getActionIds());
                        actionIds.addAll(unpublishedCollection.getArchivedActionIds());
                    }
                    if (publishedCollection != null && publishedCollection.getActionIds() != null) {
                        actionIds.addAll(publishedCollection.getActionIds());
                        actionIds.addAll(publishedCollection.getArchivedActionIds());
                    }
                    return actionIds;
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionId -> newActionService.delete(actionId)
                        // return an empty action so that the filter can remove it from the list
                        .onErrorResume(throwable -> {
                            log.debug("Failed to delete action with id {} for collection with id: {}", actionId, id);
                            log.error(throwable.getMessage());
                            return Mono.empty();
                        }))
                .collectList()
                .flatMap(actionList -> actionCollectionMono)
                .flatMap(actionCollection -> repository.delete(actionCollection).thenReturn(actionCollection))
                .flatMap(analyticsService::sendDeleteEvent);
    }
}
