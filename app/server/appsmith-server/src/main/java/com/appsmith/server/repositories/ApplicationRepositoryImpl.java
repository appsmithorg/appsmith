package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.query.MongoEntityInformation;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.annotation.Annotation;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class ApplicationRepositoryImpl extends BaseRepositoryImpl<Application, String> implements ApplicationRepository {

    @Autowired
    public ApplicationRepositoryImpl(@NonNull MongoEntityInformation<Application, String> entityInformation,
                              @NonNull ReactiveMongoOperations mongoOperations) {
        super(entityInformation, mongoOperations);
    }

    @Override
    public Mono<Application> findByName(String name) {
        Query query = new Query();
        query.addCriteria(notDeleted());

        Annotation[] annotations = entityInformation.getJavaType().getAnnotations();
        return mongoOperations.query(entityInformation.getJavaType())
                .inCollection(entityInformation.getCollectionName())
                .matching(query)
                .one();
    }

    @Override
    public Flux<Application> findAll(Example example) {
        Query query = new Query(notDeleted());
        Annotation[] annotations = entityInformation.getJavaType().getAnnotations();
        return mongoOperations.find(query, entityInformation.getJavaType(), entityInformation.getCollectionName());
    }
}
