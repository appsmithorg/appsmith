package com.appsmith.server.repositories.ce;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.ce.McpKeyCE;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

public class CustomMcpKeyRepositoryCEImpl extends BaseAppsmithRepositoryImpl<McpKey>
        implements CustomMcpKeyRepositoryCE {

    @Autowired
    private ReactiveMongoOperations mongoOperations;

    @Override
    public Mono<Long> countActiveForDiagnostics() {
        // is(null) matches a missing and a null revokedAt, like the RevokedAtIsNull queries of McpKeyRepository.
        Aggregation aggregation = Aggregation.newAggregation(
                        Aggregation.match(new Criteria()
                                .andOperator(
                                        notDeleted(),
                                        Criteria.where(McpKeyCE.Fields.revokedAt)
                                                .is(null))),
                        Aggregation.count().as("count"))
                .withOptions(DiagnosticsValues.AGGREGATION_OPTIONS);
        return mongoOperations
                .aggregate(aggregation, mongoOperations.getCollectionName(McpKey.class), Document.class)
                .next()
                .map(document -> ((Number) document.get("count")).longValue())
                .defaultIfEmpty(0L);
    }
}
