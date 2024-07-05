package com.appsmith.server.migrations.db.ce;

import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.aggregation.ArrayOperators;
import org.springframework.data.mongodb.core.aggregation.VariableOperators;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "057", id = "policy-set-to-policy-map")
public class Migration057PolicySetToPolicyMap {

    private final ReactiveMongoTemplate mongoTemplate;

    private static final Set<String> CE_COLLECTION_NAMES = Set.of(
            "actionCollection",
            "application",
            "applicationSnapshot",
            "asset",
            "collection",
            "config",
            "customJSLib",
            "datasource",
            "datasourceStorage",
            "datasourceStorageStructure",
            "emailVerificationToken",
            "gitDeployKeys",
            "newAction",
            "newPage",
            "passwordResetToken",
            "permissionGroup",
            "plugin",
            "tenant",
            "theme",
            "user",
            "userData",
            "workspace");

    private static final Set<String> EE_COLLECTION_NAMES = Set.of(
            // Empty here
            );

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        Mono.whenDelayError(
                        Mono.whenDelayError(CE_COLLECTION_NAMES.stream()
                                .map(c -> executeForCollection(mongoTemplate, c))
                                .toList()),
                        Mono.whenDelayError(EE_COLLECTION_NAMES.stream()
                                .map(c -> executeForCollection(mongoTemplate, c))
                                .toList()))
                .block();
    }

    public static Mono<Void> executeForCollection(ReactiveMongoTemplate mongoTemplate, String collectionName) {
        log.info("Migrating policies to policyMap in {}", collectionName);

        final ArrayOperators.ArrayToObject operator =
                ArrayOperators.ArrayToObject.arrayValueOfToObject(VariableOperators.Map.itemsOf("policies")
                        .as("this")
                        .andApply(agg -> new Document("k", "$$this.permission").append("v", "$$this")));

        final Mono<UpdateResult> convertToMap = mongoTemplate.updateMulti(
                new Query(where("policies")
                        .exists(true)
                        .and("policyMap")
                        .exists(false)
                        .and("deletedAt")
                        .isNull()),
                AggregationUpdate.update().set("policyMap").toValueOf(operator),
                collectionName);

        // Create a backup of the policies field so that we can rollback if needed
        final Mono<UpdateResult> backupPoliciesField = mongoTemplate.updateMulti(
                new Query(where("policies")
                        .exists(true)
                        .and("policyMap")
                        .exists(true)
                        .and("deletedAt")
                        .isNull()),
                new Update().rename("policies", "_policies"),
                collectionName);

        return convertToMap
                .then(backupPoliciesField)
                .elapsed()
                .doOnSuccess(it -> log.info("{} finished in {}ms", collectionName, it.getT1()))
                .then();
    }
}
