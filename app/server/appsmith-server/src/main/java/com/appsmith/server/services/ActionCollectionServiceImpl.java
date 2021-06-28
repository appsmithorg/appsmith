package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static java.lang.Boolean.TRUE;
import static java.util.stream.Collectors.toSet;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends BaseService<ActionCollectionRepository, ActionCollection, String> implements ActionCollectionService {
    private final CollectionService collectionService;
    private final LayoutActionService layoutActionService;
    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final PolicyGenerator policyGenerator;

    @Autowired
    public ActionCollectionServiceImpl(Scheduler scheduler,
                                       Validator validator,
                                       MongoConverter mongoConverter,
                                       ReactiveMongoTemplate reactiveMongoTemplate,
                                       ActionCollectionRepository repository,
                                       AnalyticsService analyticsService,
                                       CollectionService collectionService,
                                       LayoutActionService layoutActionService,
                                       NewActionService newActionService,
                                       NewPageService newPageService,
                                       PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.collectionService = collectionService;
        this.layoutActionService = layoutActionService;
        this.newActionService = newActionService;
        this.newPageService = newPageService;
        this.policyGenerator = policyGenerator;
    }

    /**
     * Called by ActionCollection controller to create ActionCollection.
     *
     * @param collection
     * @return
     */
    @Override
    public Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection) {
        if (collection.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        final Set<String> validationMessages = collection.validate();
        if (!validationMessages.isEmpty()) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_ACTION_COLLECTION,
                    collection.getName(),
                    validationMessages.toString()));
        }

        final String pageId = collection.getPageId();
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add(FieldName.PAGE_ID, pageId);
        Mono<NewPage> pageMono = newPageService
                .findById(pageId, READ_PAGES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, pageId)))
                .cache();

        // First check if the collection name is allowed
        // If the collection name is unique, the action name will be guaranteed to be unique within that collection
        return pageMono
                .flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    // Check against widget names and action names
                    return layoutActionService.isNameAllowed(page.getId(), layout.getId(), collection.getName());
                })
                // Check against collection names
                .zipWith(isDuplicateActionCollection(collection.getName(), params))
                .flatMap(tuple -> {
                    // If the name is allowed, return pageMono for further processing
                    if (Boolean.TRUE.equals(tuple.getT1()) && Boolean.FALSE.equals(tuple.getT2())) {
                        return Mono.justOrEmpty(collection.getActions()).defaultIfEmpty(List.of());
                    }
                    // Throw an error since the new action collection's name matches an existing action, widget or collection name.
                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, collection.getName(), FieldName.NAME));
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(action -> {
                    if (action.getId() == null) {
                        // Make sure that the proper values are used for the new action
                        action.setFullyQualifiedName(collection.getName() + "." + action.getName());
                        action.setOrganizationId(collection.getOrganizationId());
                        action.setPageId(collection.getPageId());
                        action.setApplicationId(collection.getApplicationId());
                        // Action doesn't exist. Create now.
                        return layoutActionService
                                .createAction(action)
                                // return an empty action so that the filter can remove it from the list
                                .onErrorResume(throwable -> {
                                    log.debug("Failed to create action with name {} for collection: {}", action.getName(), collection.getName());
                                    log.error(throwable.getMessage());
                                    return Mono.just(new ActionDTO());
                                })
                                .retry(2);
                    }
                    // This would occur when the new collection is created by grouping existing actions
                    // We do not expect to have to update the action at this point
                    return Mono.just(action);
                })
                // If action creation has failed for some reason, ignore that action
                // We will expect the user to update this definition after editing the body of the collection
                .filter(action -> action.getId() != null)
                .collectList()
                .zipWith(pageMono)
                .flatMap(tuple -> {
                    final List<ActionDTO> actions = tuple.getT1();
                    final NewPage newPage = tuple.getT2();

                    ActionCollection actionCollection = new ActionCollection();
                    actionCollection.setApplicationId(collection.getApplicationId());
                    actionCollection.setOrganizationId(collection.getOrganizationId());
                    actionCollection.setUnpublishedCollection(collection);
                    this.generateAndSetPolicies(newPage, actionCollection);

                    final Set<String> actionIds = actions
                            .stream()
                            .map(ActionDTO::getId)
                            .collect(toSet());
                    collection.setActionIds(actionIds);

                    final Mono<ActionCollection> actionCollectionMono = this
                            .create(actionCollection)
                            .cache();
                    return actionCollectionMono
                            .map(actionCollection1 -> {
                                actions.forEach(actionDTO -> {
                                    actionDTO.setCollectionId(actionCollection1.getId());
                                });
                                return actions;
                            })
                            .flatMapMany(Flux::fromIterable)
                            .flatMap(action -> layoutActionService.updateAction(action.getId(), action))
                            .collectList()
                            .zipWith(actionCollectionMono)
                            .flatMap(tuple1 -> {
                                tuple1.getT2().getUnpublishedCollection().setId(tuple1.getT2().getId());
                                return splitValidActionsByViewMode(
                                        tuple1.getT2().getUnpublishedCollection(),
                                        tuple1.getT1(),
                                        false);
                            });
                });


        // if it is, then scope the actions' fully qualified names by collection name

        // create or update all the actions in the list to belong to this collection
        // we will not expect failures in action updates because client side should handle name duplication for actions
        // after action updates, populate collection object with common fields
        // create collection and return with actions


    }

    @Override
    public void generateAndSetPolicies(NewPage page, ActionCollection actionCollection) {
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(page.getPolicies(), Page.class, Action.class);
        actionCollection.setPolicies(documentPolicies);
    }

    @Override
    public Mono<Boolean> isDuplicateActionCollection(String name, MultiValueMap<String, String> params) {
        Mono<Set<String>> actionCollectionNamesInPageMono =
                this.getActionCollectionsByViewMode(params, false)
                        .map(ActionCollectionDTO::getName)
                        .collect(toSet())
                        .switchIfEmpty(Mono.just(Set.of()));

        return actionCollectionNamesInPageMono
                .map(actionCollectionNames -> actionCollectionNames.contains(name));
    }

    @Override
    public Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode) {
        return this.getActionCollectionsByViewMode(params, viewMode)
                .flatMap(actionCollectionDTO -> this.populateActionCollectionByViewMode(actionCollectionDTO, viewMode));

    }

    private Mono<ActionCollectionDTO> populateActionCollectionByViewMode(ActionCollectionDTO actionCollectionDTO1, Boolean viewMode) {
        return Mono.just(actionCollectionDTO1)
                .flatMap(actionCollectionDTO -> Flux.fromIterable(actionCollectionDTO.getActionIds())
                        .mergeWith(Flux.fromIterable(actionCollectionDTO.getArchivedActionIds()))
                        .flatMap(actionId -> {
                            return newActionService.findActionDTObyIdAndViewMode(actionId, viewMode, READ_ACTIONS);
                        })
                        .collectList()
                        .flatMap(actionsList -> splitValidActionsByViewMode(actionCollectionDTO, actionsList, viewMode)));
    }

    private Mono<ActionCollectionDTO> splitValidActionsByViewMode(ActionCollectionDTO actionCollectionDTO, List<ActionDTO> actionsList, Boolean viewMode) {
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
                    .map(actionCollection ->
                            Boolean.TRUE.equals(viewMode) ?
                                    actionCollection.getPublishedCollection()
                                    : actionCollection.getUnpublishedCollection());
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

    /**
     * Called by Action controller to create Action
     *
     * @param action
     * @return
     */
    @Override
    public Mono<ActionDTO> createAction(ActionDTO action) {
        if (action.getCollectionId() == null) {
            return layoutActionService.createAction(action);
        }

        ActionDTO finalAction = action;
        return layoutActionService.createAction(action)
                .flatMap(savedAction -> collectionService.addSingleActionToCollection(finalAction.getCollectionId(), savedAction));
    }

    @Override
    public Mono<ActionDTO> updateAction(String id, ActionDTO action) {

        // Since the policies are server only concept, we should first set this to null.
        action.setPolicies(null);

        //The change was not in CollectionId, just go ahead and update normally
        if (action.getCollectionId() == null) {
            return layoutActionService.updateAction(id, action);
        } else if (action.getCollectionId().length() == 0) {
            //The Action has been removed from existing collection.
            return newActionService
                    .getById(id)
                    .flatMap(action1 -> collectionService.removeSingleActionFromCollection(action1.getUnpublishedAction().getCollectionId(),
                            Mono.just(action1)))
                    .flatMap(action1 -> {
                        log.debug("Action {} has been removed from its collection.", action1.getId());
                        action.setCollectionId(null);
                        return layoutActionService.updateAction(id, action);
                    });
        } else {
            //If the code flow has reached this point, that means that the collectionId has been changed to another collection.
            //Remove the action from previous collection and add it to the new collection.
            return newActionService
                    .getById(id)
                    .flatMap(action1 -> {
                        if (action1.getUnpublishedAction().getCollectionId() != null) {
                            return collectionService.removeSingleActionFromCollection(action1.getUnpublishedAction().getCollectionId(),
                                    Mono.just(action1));
                        }
                        return Mono.just(newActionService.generateActionByViewMode(action1, false));
                    })
                    .map(obj -> (NewAction) obj)
                    .flatMap(action1 -> {
                        ActionDTO unpublishedAction = action1.getUnpublishedAction();
                        unpublishedAction.setId(action1.getId());
                        return collectionService.addSingleActionToCollection(action.getCollectionId(), unpublishedAction);
                    })
                    .flatMap(action1 -> {
                        log.debug("Action {} removed from its previous collection and added to the new collection", action1.getId());
                        return layoutActionService.updateAction(id, action);
                    });
        }
    }

    @Override
    public Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<ActionCollection> actionCollectionMono = repository.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION_COLLECTION, id)))
                .cache();

        final Set<String> validActionIds = actionCollectionDTO
                .getActions()
                .stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> archivedActionIds = actionCollectionDTO
                .getArchivedActions()
                .stream()
                .map(ActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
        final Set<String> actionIds = new HashSet<>();
        actionIds.addAll(validActionIds);
        actionIds.addAll(archivedActionIds);

        final Mono<Set<String>> newValidActionIdsMono = Mono.just(actionCollectionDTO)
                .map(ActionCollectionDTO::getActions)
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionDTO -> {
                    actionDTO.setCollectionId(id);
                    if (actionDTO.getId() == null) {
                        // this is a new action, we need to create one
                        return layoutActionService.createAction(actionDTO);
                    } else {
                        return layoutActionService.updateAction(actionDTO.getId(), actionDTO);
                    }
                })
                .map(ActionDTO::getId)
                .collect(Collectors.toSet());

        final Mono<Set<String>> newArchivedActionIdsMono = Mono.just(actionCollectionDTO)
                .map(ActionCollectionDTO::getArchivedActions)
                .flatMapMany(Flux::fromIterable)
                .flatMap(actionDTO -> {
                    actionDTO.setCollectionId(id);
                    actionDTO.setArchivedAt(Instant.now());
                    if (actionDTO.getId() == null) {
                        // this is a new action, we need to create one
                        return layoutActionService.createAction(actionDTO);
                    } else {
                        return layoutActionService.updateAction(actionDTO.getId(), actionDTO);
                    }
                })
                .map(ActionDTO::getId)
                .collect(Collectors.toSet());

        // First collect all valid action ids from before, and diff against incoming action ids
        return actionCollectionMono
                .map(actionCollection -> {
                    // From the existing collection, if an action id is not referenced at all anymore,
                    // this means the action has been somehow deleted
                    final Set<String> oldActionIds = new HashSet<>();
                    if (actionCollection.getUnpublishedCollection().getActionIds() != null) {
                        oldActionIds.addAll(actionCollection
                                .getUnpublishedCollection()
                                .getActionIds());
                    }
                    if (actionCollection.getUnpublishedCollection().getArchivedActionIds() != null) {
                        oldActionIds.addAll(actionCollection
                                .getUnpublishedCollection()
                                .getArchivedActionIds());
                    }

                    return oldActionIds
                            .stream()
                            .filter(Objects::nonNull)
                            .filter(x -> !actionIds.contains(x))
                            .collect(Collectors.toUnmodifiableSet());
                })
                .flatMapMany(Flux::fromIterable)
                // TODO determine whether we want to simply remove these from the collection instead
                .flatMap(newActionService::deleteUnpublishedAction)
                .then(Mono.zip(newValidActionIdsMono, newArchivedActionIdsMono))
                .flatMap(tuple -> {
                    actionCollectionDTO.setActionIds(tuple.getT1());
                    actionCollectionDTO.setArchivedActionIds(tuple.getT2());
                    return actionCollectionMono
                            .map(dbActionCollection -> {
                                copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());
                                return dbActionCollection;
                            });
                })
                .flatMap(actionCollection -> this.update(id, actionCollection))
                .flatMap(analyticsService::sendUpdateEvent)
                .flatMap(actionCollection -> this.populateActionCollectionByViewMode(actionCollection.getUnpublishedCollection(), false));
        // new actions without ids are to be created
        // new actions with ids are to be updated and added to collection
        // old actions that are now missing are to be archived
        // rest are to be updated
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
                                .flatMap(newActionService::deleteUnpublishedAction)
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

        actionCollectionDTO.setId(actionCollection.getId());
        actionCollectionDTO.setOrganizationId(actionCollection.getOrganizationId());
        actionCollectionDTO.setApplicationId(actionCollection.getApplicationId());

        return Mono.just(actionCollectionDTO);
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
                    if (unpublishedCollection != null) {
                        final Set<String> actionIds = new HashSet<>(unpublishedCollection.getActionIds());
                        actionIds.addAll(unpublishedCollection.getArchivedActionIds());
                        if (publishedCollection != null && publishedCollection.getActionIds() != null) {
                            actionIds.addAll(publishedCollection.getActionIds());
                            actionIds.addAll(publishedCollection.getArchivedActionIds());
                        }
                        return actionIds;
                    } else if (publishedCollection != null && publishedCollection.getActionIds() != null) {
                        final Set<String> actionIds = new HashSet<>(publishedCollection.getActionIds());
                        actionIds.addAll(publishedCollection.getArchivedActionIds());
                        return actionIds;
                    } else {
                        return Set.<String>of();
                    }
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(newActionService::delete)
                .collectList()
                .flatMap(actionList -> actionCollectionMono)
                .flatMap(actionCollection -> repository.delete(actionCollection).thenReturn(actionCollection))
                .flatMap(analyticsService::sendDeleteEvent);
    }
}
