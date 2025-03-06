package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
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
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Set;

import static com.appsmith.external.helpers.StringUtils.dotted;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;
import static com.appsmith.server.migrations.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;

/**
 * Migration to convert the policies field to a policyMap field in all the collections. The key defines the permission
 * whereas the value is the actual policy object. This makes it easier to use this data in code, to query as a MongoDB
 * nested document, and as a Postgres jsonb column.
 */
@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "059", id = "policy-set-to-policy-map")
public class Migration059PolicySetToPolicyMap {

    private final ReactiveMongoTemplate mongoTemplate;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

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

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        Mono.whenDelayError(CE_COLLECTION_NAMES.stream()
                        .map(c -> executeForCollection(mongoTemplate, c))
                        .toList())
                .onErrorResume(error -> {
                    String errorPrefix = "Error while migrating policies to policyMap";
                    // As we are using Mono.whenDelayError, we expect multiple errors to be suppressed in a single error
                    if (error.getSuppressed().length > 0) {
                        for (Throwable suppressed : error.getSuppressed()) {
                            log.error(errorPrefix, suppressed);
                        }
                    } else {
                        log.error(errorPrefix, error);
                    }
                    return Mono.error(error);
                })
                .block();

        // Evict the default tenant from the cache to ensure that the updated tenant object is fetched from the database
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is(DEFAULT));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class).block();
        assert defaultTenant != null : "Default tenant not found";

        // The following code line has been commented as part of Tenant to Organization migration. The function does not
        // exist
        // anymore and no need to evict the cached tenant anymore because Migration 065 would migrate the tenant to
        // organization
        // and a new cache line would be set for the organization.
        //        cacheableRepositoryHelper.evictCachedTenant(defaultTenant.getId()).block();
    }

    private static Mono<Void> executeForCollection(ReactiveMongoTemplate mongoTemplate, String collectionName) {
        log.info("Migrating policies to policyMap in {}", collectionName);

        // We are creating a aggregation pipeline to convert the policies field to a policyMap field. We use `this`
        // keyword to capture the policies field within the object and then convert it to a key-value pair. Key is the
        // permission and value is the policy object itself.
        final ArrayOperators.ArrayToObject operator =
                ArrayOperators.ArrayToObject.arrayValueOfToObject(VariableOperators.Map.itemsOf(POLICIES)
                        .as("this")
                        .andApply(agg -> new Document("k", "$$this.permission").append("v", "$$this")));

        // Migrate the policies field to the policyMap field only if the policies field exists and is not empty
        // Also policyMap is used as idempotency key to avoid updating same docs in case of failures
        Criteria validPolicyCriteria = where(dotted(POLICIES, "0")).exists(true);
        Criteria policyMapNotExists = new Criteria()
                .orOperator(where(POLICY_MAP).exists(false), where(POLICY_MAP).is(new HashMap<>()));
        Criteria notDeletedCriteria = where("deletedAt").isNull();

        final Query query = new Query()
                .addCriteria(validPolicyCriteria)
                .addCriteria(policyMapNotExists)
                .addCriteria(notDeletedCriteria);
        final Mono<UpdateResult> convertToMap = mongoTemplate.updateMulti(
                query, AggregationUpdate.update().set(POLICY_MAP).toValueOf(operator), collectionName);

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
