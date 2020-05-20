package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Sequence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.FindAndModifyOptions.options;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Service
public class SequenceServiceImpl implements SequenceService {

    private final ReactiveMongoTemplate mongoTemplate;

    @Autowired
    public SequenceServiceImpl(ReactiveMongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Mono<Long> getNext(String name) {
        return mongoTemplate
                .findAndModify(
                        query(where("name").is(name)),
                        new Update().inc("nextNumber", 1),
                        options().upsert(true),
                        Sequence.class
                )
                .map(Sequence::getNextNumber);
    }

    @Override
    public Mono<Long> getNext(Class<? extends BaseDomain> domainClass) {
        return getNext(mongoTemplate.getCollectionName(domainClass));
    }

    @Override
    public Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass) {
        return getNext(mongoTemplate.getCollectionName(domainClass))
                .map(number -> number > 1 ? " " + number : "");
    }

}
