package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import static com.appsmith.external.helpers.StringUtils.dotted;
import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.migrations.constants.DeprecatedFieldName.DELETED;
import static com.appsmith.server.migrations.constants.FieldName.DELETED_AT;
import static com.appsmith.server.migrations.constants.FieldName.PERMISSION_GROUPS;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static com.appsmith.server.migrations.constants.FieldName.TENANT_ID;

/**
 * This migration adds indexes to the policyMap fields within application and workspace collection to speed up queries.
 * This migration also adds a compound index on the deleted and deletedAt fields to speed up queries that filter on
 * these fields.
 * Ideally we should rely on @see <a href="https://www.mongodb.com/docs/v5.0/core/index-wildcard/#wildcard-indexes">Wildcard Indexes</a>,
 * but this may end up hogging a lot of memory as it recursively create index on policyMap, hence we are just creating
 * the compound index which have the most impact.
 */
@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "060", id = "add-idx-policy-map", author = " ")
public class Migration060AddIndexesForPolicyMap {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        String readWorkspaceTanantIdCompoundIndex = "policy_read_workspace_tanantId_compound_index";
        String policyMapReadWorkspacePath = dotted(POLICY_MAP, "read:workspaces", PERMISSION_GROUPS);

        String manageWorkspaceTanantIdCompoundIndex = "policy_manage_workspace_tanantId_compound_index";
        String policyMapManageWorkspacePath = dotted(POLICY_MAP, "manage:workspaces", PERMISSION_GROUPS);

        Mono<Boolean> readWorkspaceMono = Mono.fromCallable(() -> {
                    log.debug("Adding read workspace policy map indices");
                    createAndApplyIndex(
                            readWorkspaceTanantIdCompoundIndex,
                            Workspace.class,
                            policyMapReadWorkspacePath,
                            TENANT_ID,
                            DELETED,
                            DELETED_AT);
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());

        Mono<Boolean> manageWorkspaceMono = Mono.fromCallable(() -> {
                    log.debug("Adding manage workspace policy map indices");
                    createAndApplyIndex(
                            manageWorkspaceTanantIdCompoundIndex,
                            Workspace.class,
                            policyMapManageWorkspacePath,
                            TENANT_ID,
                            DELETED,
                            DELETED_AT);
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());

        Mono.zip(readWorkspaceMono, manageWorkspaceMono).block();
    }

    private void createAndApplyIndex(String indexName, Class<?> clazz, String... fields) {
        try {
            Index index = makeIndex(fields).named(indexName);
            dropIndexIfExists(mongoTemplate, clazz, indexName);
            ensureIndexes(mongoTemplate, clazz, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    indexName,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", indexName, e);
        }
    }
}
