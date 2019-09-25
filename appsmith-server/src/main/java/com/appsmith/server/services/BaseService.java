package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.BaseDomain;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.BaseRepository;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.TrackMessage;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashMap;
import java.util.Map;

public abstract class BaseService<R extends BaseRepository, T extends BaseDomain, ID> implements CrudService<T, ID> {

    final Scheduler scheduler;

    protected final MongoConverter mongoConverter;

    protected final ReactiveMongoTemplate mongoTemplate;

    protected final R repository;

    protected final Validator validator;

    protected final Analytics analytics;

    protected final SessionUserService sessionUserService;

    public BaseService(Scheduler scheduler,
                       Validator validator,
                       MongoConverter mongoConverter,
                       ReactiveMongoTemplate reactiveMongoTemplate,
                       R repository, Analytics analytics, SessionUserService sessionUserService) {
        this.scheduler = scheduler;
        this.validator = validator;
        this.mongoConverter = mongoConverter;
        this.mongoTemplate = reactiveMongoTemplate;
        this.repository = repository;
        this.analytics = analytics;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<T> update(ID id, T resource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Query query = new Query(Criteria.where("id").is(id));

        DBObject update = getDbObject(resource);

        Update updateObj = new Update();
        Map<String, Object> updateMap = update.toMap();
        updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

        return mongoTemplate.updateFirst(query, updateObj, resource.getClass())
                .flatMap(obj -> repository.findById(id));
    }

    @Override
    public Flux<T> get() {
        return repository.findAll();
    }

    @Override
    public Mono<T> getById(ID id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<T> create(T object) {
        Mono<User> userMono = sessionUserService.getCurrentUser();
        return Mono.just(object)
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(this::segmentTrackCreate);
    }

    private DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    /**
     * This function runs the validation checks on the object and returns a Mono.error if any of the constraints
     * have been violated. If all checks pass, a Mono of the object is returned back to the caller
     *
     * @param obj
     * @return Mono<T>
     */
    protected Mono<T> validateObject(T obj) {
        return Mono.just(obj)
                .map(o -> validator.validate(o))
                .flatMap(constraint -> {
                    if (constraint.isEmpty()) {
                        return Mono.just(obj);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, constraint.stream().findFirst().get().getPropertyPath()));
                });
    }

    protected Mono<T> segmentTrackCreate(Object savedObject) {
        Mono<User> userMono = sessionUserService.getCurrentUser();
        return userMono
                .map(user -> {
                    HashMap<String, String> analyticsProperties = new HashMap<>();
                    analyticsProperties.put("id", ((BaseDomain) savedObject).getId());
                    analyticsProperties.put("organizationId", user.getOrganizationId());
                    analytics.enqueue(
                            TrackMessage.builder("MONGO_DB_CREATE_" + savedObject.getClass().getSimpleName().toUpperCase())
                                    .userId(user.getId())
                                    .properties(analyticsProperties)
                    );
                    return (T) savedObject;
                })
                .switchIfEmpty(Mono.just((T) savedObject));
    }
}