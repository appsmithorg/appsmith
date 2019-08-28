package com.appsmith.server.services;

import com.appsmith.server.domains.BaseDomain;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.BaseRepository;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;

public abstract class BaseService<R extends BaseRepository, T extends BaseDomain, ID> implements CrudService<T, ID> {

    final Scheduler scheduler;

    protected final MongoConverter mongoConverter;

    protected final ReactiveMongoTemplate mongoTemplate;

    protected final R repository;

    public BaseService(Scheduler scheduler,
                       MongoConverter mongoConverter,
                       ReactiveMongoTemplate reactiveMongoTemplate,
                       R repository) {
        this.scheduler = scheduler;
        this.mongoConverter = mongoConverter;
        this.mongoTemplate = reactiveMongoTemplate;
        this.repository = repository;
    }

    @Override
    public Mono<T> update(ID id, T resource) throws Exception {
        if (id == null) {
            throw new Exception("Invalid id provided");
        }

        Query query = new Query(Criteria.where("id").is(id));

        DBObject update = getDbObject(resource);

        Update updateObj = new Update();
        Map<String, Object> updateMap = update.toMap();
        updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

        return mongoTemplate.updateFirst(query, updateObj, resource.getClass())
                .flatMap(obj -> repository.findById(id))
                .subscribeOn(scheduler);
    }

    @Override
    public Flux<T> get() {
        return repository.findAll();
    }

    @Override
    public Mono<T> getById(ID id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }
    
    @Override
    public Mono<T> create(T object) throws AppsmithException {
        return repository.save(object);
    }

    private DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }
}