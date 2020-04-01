package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
public abstract class BaseService<R extends BaseRepository & AppsmithRepository, T extends BaseDomain, ID> implements CrudService<T, ID> {

    final Scheduler scheduler;

    protected final MongoConverter mongoConverter;

    protected final ReactiveMongoTemplate mongoTemplate;

    protected final R repository;

    protected final Validator validator;

    protected final AnalyticsService analyticsService;

    public BaseService(Scheduler scheduler,
                       Validator validator,
                       MongoConverter mongoConverter,
                       ReactiveMongoTemplate reactiveMongoTemplate,
                       R repository, AnalyticsService analyticsService) {
        this.scheduler = scheduler;
        this.validator = validator;
        this.mongoConverter = mongoConverter;
        this.mongoTemplate = reactiveMongoTemplate;
        this.repository = repository;
        this.analyticsService = analyticsService;
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
                .flatMap(obj -> repository.findById(id))
                .flatMap(updatedObj -> analyticsService.sendEvent(AnalyticsEvents.UPDATE + "_" + updatedObj.getClass().getSimpleName().toUpperCase(), (T) updatedObj));
    }

    protected Flux<T> getWithPermission(MultiValueMap<String, String> params, AclPermission aclPermission) {
        List<Criteria> criterias = new ArrayList<>();

        if (params != null && !params.isEmpty()) {
            criterias = params.entrySet().stream()
                    .map(entry -> {
                        String key = entry.getKey();
                        List<String> values = entry.getValue();
                        Criteria criteria = Criteria.where(key).in(values);
                        return criteria;
                    })
                    .collect(Collectors.toList());
        }
        return repository.queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<T> get(MultiValueMap<String, String> params) {
        // In the base service we aren't handling the query parameters. In order to filter records using the query params,
        // each service must implement it for their usecase. Need to come up with a better strategy for doing this.
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
        return Mono.just(object)
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(savedObj -> analyticsService.sendEvent(AnalyticsEvents.CREATE + "_" + savedObj.getClass().getSimpleName().toUpperCase(), (T) savedObj));
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    @Override
    public Mono<T> delete(ID id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
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
}