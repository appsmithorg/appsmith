package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Sequence;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.FindAndModifyOptions.options;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@RequiredArgsConstructor
public class SequenceServiceCEImpl implements SequenceServiceCE {

    private final ReactiveMongoTemplate mongoTemplate;

    private Mono<Long> getNext(String name) {
        return mongoTemplate
                .findAndModify(
                        query(where("name").is(name)),
                        new Update().inc("nextNumber", 1),
                        options().returnNew(true).upsert(true),
                        Sequence.class)
                .map(Sequence::getNextNumber);
    }

    @Override
    public Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass, String suffix) {
        final String className = domainClass.getName();
        final String name = className.substring(0, 1).toLowerCase() + className.substring(1) + suffix;
        return getNext(name).map(number -> number > 1 ? " " + number : "");
    }
}
