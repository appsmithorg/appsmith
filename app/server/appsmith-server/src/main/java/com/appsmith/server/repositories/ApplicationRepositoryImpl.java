package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
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

//    public ApplicationRepositoryImpl(@NonNull MongoEntityInformation<Application, String> entityInformation,
//                              @NonNull ReactiveMongoOperations mongoOperations) {
//        super(entityInformation, mongoOperations);
//    }

    // TODO: Not implemented yet
    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String orgId) {
        Query query = new Query();
        return Mono.empty() ;
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
}
