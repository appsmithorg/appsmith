package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;

@Slf4j
public class CollectionServiceCEImpl extends BaseService<CollectionRepository, Collection, String> implements CollectionServiceCE {

    public CollectionServiceCEImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   CollectionRepository repository,
                                   AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<Collection> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Collection> addActionsToCollection(Collection collection, List<NewAction> actions) {
        collection.setActions(actions);
        return repository.save(collection);

    }

    @Override
    public Mono<ActionDTO> addSingleActionToCollection(String collectionId, ActionDTO action) {
        if (collectionId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        if (action.getId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION));
        }

        return repository
                .findById(collectionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.COLLECTION_ID)))
                .flatMap(collection1 -> {
                    List<NewAction> actions = collection1.getActions();
                    if (actions == null) {
                        actions = new ArrayList<>();
                    }
                    /**
                     * TODO
                     * Use MonoTemplate instead of Mongo repository to do this for better performance. Refer to
                     * the following link for more details :
                     * https://stackoverflow.com/questions/38261838/add-object-to-an-array-in-java-mongodb
                     */
                    NewAction toSave = new NewAction();
                    toSave.setId(action.getId());
                    actions.add(toSave);
                    collection1.setActions(actions);
                    return repository.save(collection1);
                })
                .map(collection -> {
                    log.debug("Action {} added to Collection {}", action.getId(), collection.getId());
                    return action;
                });
    }

    @Override
    public Mono<NewAction> removeSingleActionFromCollection(String collectionId, Mono<NewAction> actionMono) {
        if (collectionId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository
                .findById(collectionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.COLLECTION_ID)))
                .zipWith(actionMono)
                .flatMap(tuple -> {
                    Collection collection = tuple.getT1();
                    NewAction action = tuple.getT2();

                    if (action.getId() == null) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION));
                    }

                    List<NewAction> actions = collection.getActions();
                    if (actions == null || actions.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION_ID + " or " + FieldName.COLLECTION_ID));
                    }
                    ListIterator<NewAction> actionIterator = actions.listIterator();
                    while (actionIterator.hasNext()) {
                        if (actionIterator.next().getId().equals(action.getId())) {
                            actionIterator.remove();
                            break;
                        }
                    }
                    log.debug("Action {} removed from Collection {}", action.getId(), collection.getId());
                    return repository.save(collection);
                })
                .then(actionMono);
    }
}
