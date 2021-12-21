package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Sequence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.FindAndModifyOptions.options;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;


public class SequenceServiceCEImpl implements SequenceServiceCE {

    private final ReactiveMongoTemplate mongoTemplate;

    @Autowired
    public SequenceServiceCEImpl(ReactiveMongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Mono<Long> getNext(String name) {
        return mongoTemplate
                .findAndModify(
                        query(where("name").is(name)),
                        new Update().inc("nextNumber", 1),
                        options().returnNew(true).upsert(true),
                        Sequence.class
                )
                .map(Sequence::getNextNumber);
    }

    @Override
    public Mono<Long> getNext(Class<? extends BaseDomain> domainClass, String suffix) {
        return getNext(mongoTemplate.getCollectionName(domainClass) + suffix);
    }

    @Override
    public Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass, String suffix) {
        return getNext(mongoTemplate.getCollectionName(domainClass) + suffix)
                .map(number -> number > 1 ? " " + number : "");
    }

}
