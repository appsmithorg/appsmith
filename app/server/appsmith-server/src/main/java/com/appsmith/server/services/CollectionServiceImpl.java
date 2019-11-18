package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CollectionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;

@Slf4j
@Service
public class CollectionServiceImpl extends BaseService<CollectionRepository, Collection, String> implements CollectionService {

    public CollectionServiceImpl(Scheduler scheduler,
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
    public Mono<Collection> addActionsToCollection(Collection collection, List<Action> actions) {
        collection.setActions(actions);
        return repository.save(collection);

    }

    @Override
    public Mono<Action> addSingleActionToCollection(String collectionId, Action action) {
        if (collectionId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }
        if (action.getId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "action"));
        }

        return repository
                .findById(collectionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "collection Id")))
                .flatMap(collection1 -> {
                    List<Action> actions = collection1.getActions();
                    if (actions == null) {
                        actions = new ArrayList<>();
                    }
                    /**
                     * TODO
                     * Use MonoTemplate instead of Mongo repository to do this for better performance. Refer to
                     * the following link for more details :
                     * https://stackoverflow.com/questions/38261838/add-object-to-an-array-in-java-mongodb
                     */
                    Action toSave = new Action();
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
    public Mono<Action> removeSingleActionFromCollection(String collectionId, Action action) {
        if (collectionId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        }
        if (action.getId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "action"));
        }

        return repository
                .findById(collectionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "collectionId")))
                .flatMap(collection -> {
                    List<Action> actions = collection.getActions();
                    if (actions == null || actions.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "actionId or collectionId"));
                    }
                    ListIterator<Action> actionIterator = actions.listIterator();
                    while (actionIterator.hasNext()) {
                        if (actionIterator.next().getId().equals(action.getId())) {
                            actionIterator.remove();
                            break;
                        }
                    }
                    return repository.save(collection);
                })
                .map(collection -> {
                    log.debug("Action {} removed from Collection {}", action.getId(), collection.getId());
                    return action;
                });
    }
}
