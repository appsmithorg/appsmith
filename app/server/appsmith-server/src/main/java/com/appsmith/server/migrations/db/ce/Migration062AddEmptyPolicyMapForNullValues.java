package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.helpers.Stopwatch;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Set;

import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "062", id = "add_empty_policyMap_for_null_entries")
public class Migration062AddEmptyPolicyMapForNullValues {

    private final ReactiveMongoTemplate mongoTemplate;

    private static final Set<String> COLLECTION_NAMES = Set.of(
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
            "theme",
            "user",
            "userData",
            "workspace",
            "approvalRequest",
            "auditLog",
            "datasourceConfigurationStructure",
            "environment",
            "inviteUser",
            "knowledgeStore",
            "module",
            "moduleInstance",
            "package",
            "role",
            "userApiKey",
            "userGroup",
            "workflow");

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        Stopwatch stopwatch = new Stopwatch("Migration062AddEmptyPolicyMapForNullValues");
        Mono.whenDelayError(COLLECTION_NAMES.stream()
                        .map(c -> addEmptyPolicyMapForNullEntries(mongoTemplate, c))
                        .toList())
                .onErrorResume(error -> {
                    String errorPrefix = "Error while adding empty policyMap for null values";
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
        stopwatch.stopAndLogTimeInMillis();
    }

    private static Mono<Void> addEmptyPolicyMapForNullEntries(
            ReactiveMongoTemplate mongoTemplate, String collectionName) {
        log.info("Adding empty policyMap for empty policies {}", collectionName);

        // Update policyMap for documents where policies is empty or null
        Criteria policyMapNotExists =
                new Criteria().orOperator(where(POLICY_MAP).exists(false));
        Criteria notDeletedCriteria = where("deletedAt").isNull();

        final Query query = new Query().addCriteria(policyMapNotExists).addCriteria(notDeletedCriteria);
        UpdateDefinition update = new Update().set(POLICY_MAP, new HashMap<>());
        final Mono<UpdateResult> convertToMap = mongoTemplate.updateMulti(query, update, collectionName);

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
