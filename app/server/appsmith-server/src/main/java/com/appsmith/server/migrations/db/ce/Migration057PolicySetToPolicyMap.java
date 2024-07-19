package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
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
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.external.helpers.StringUtils.dotted;
import static com.appsmith.server.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;

/**
 * Migration to convert the policies field to a policyMap field in all the collections. The key defines the permission
 * whereas the value is the actual policy object. This makes it easier to use this data in code, to query as a MongoDB
 * nested document, and as a Postgres jsonb column.
 */
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

    private static Mono<Void> executeForCollection(ReactiveMongoTemplate mongoTemplate, String collectionName) {
        log.info("Migrating policies to policyMap in {}", collectionName);

        final ArrayOperators.ArrayToObject operator =
                ArrayOperators.ArrayToObject.arrayValueOfToObject(VariableOperators.Map.itemsOf(POLICIES)
                        .as("this")
                        .andApply(agg -> new Document("k", "$$this.permission").append("v", "$$this")));

        final Mono<UpdateResult> convertToMap = mongoTemplate.updateMulti(
                // Migrate the policies field to the policyMap field only if the policies field exists and is not empty
                new Query(where(dotted(POLICIES, "0"))
                        .exists(true)
                        .and(BaseDomain.Fields.deletedAt)
                        .isNull()),
                AggregationUpdate.update().set(BaseDomain.Fields.policyMap).toValueOf(operator),
                collectionName);

        return convertToMap
                .elapsed()
                .doOnSuccess(it -> log.info(
                        "Migrated {} documents in {} in {}ms",
                        it.getT2().getModifiedCount(),
                        collectionName,
                        it.getT1()))
                .then();
    }
}
