package com.appsmith.server.services;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ActionCollectionServiceImpl implements ActionCollectionService {
    private final CollectionService collectionService;
    private final LayoutActionService layoutActionService;
    private final NewActionService newActionService;

    @Autowired
    public ActionCollectionServiceImpl(CollectionService collectionService,
                                       LayoutActionService layoutActionService,
                                       NewActionService newActionService) {
        this.collectionService = collectionService;
        this.layoutActionService = layoutActionService;
        this.newActionService = newActionService;
    }

    /**
     * Called by Collection controller to create Collection.
     *
     * @param collection
     * @return
     */
    @Override
    public Mono<Collection> createCollection(Collection collection) {
        if (collection.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }

        if (collection.getActions() == null) {
            return collectionService.create(collection);
        }

        return Mono.just(collection.getActions())
                .flatMapMany(Flux::fromIterable)
                .flatMap(action -> {
                    if (action.getId() == null) {
                        //Action doesn't exist. Create now.
                        return layoutActionService.createAction(action.getUnpublishedAction());
                    }
                    return Mono.just(action.getUnpublishedAction());
                })
                //Need to store only action Ids inside the collection. Extract only ids and return the same inside Action
                .map(action -> {
                    NewAction toSave = new NewAction();
                    toSave.setId(action.getId());
                    return toSave;
                })
                .collectList()
                .flatMap(actions -> {
                    collection.setActions(null);
                    return collectionService
                            .create(collection)
                            .flatMap(savedCollection ->
                                    collectionService.addActionsToCollection(savedCollection, actions));
                });
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
}
