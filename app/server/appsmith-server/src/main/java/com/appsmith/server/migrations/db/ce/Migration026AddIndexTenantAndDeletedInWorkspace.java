package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "026", id = "add-index-workspace-tenant-deleted", author = " ")
public class Migration026AddIndexTenantAndDeletedInWorkspace {

    private final MongoTemplate mongoTemplate;

    private static final String WORKSPACE_COMPOUND_INDEX_TENANT = "tenantId_deleted_compound_index";
    private static final String TENANT_ID = "tenantId";

    public Migration026AddIndexTenantAndDeletedInWorkspace(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexInWorkspaceCollection() {

        dropIndexIfExists(mongoTemplate, Workspace.class, WORKSPACE_COMPOUND_INDEX_TENANT);

        Index tenantDeletedAtIndex =
                makeIndex(TENANT_ID, FieldName.DELETED, FieldName.DELETED_AT).named(WORKSPACE_COMPOUND_INDEX_TENANT);

        try {
            ensureIndexes(mongoTemplate, Workspace.class, tenantDeletedAtIndex);
        } catch (UncategorizedMongoDbException mongockException) {
            log.debug(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    WORKSPACE_COMPOUND_INDEX_TENANT,
                    mongockException.getMessage());
        } catch (Exception exception) {
            log.debug("An error occurred while creating the index : {}", WORKSPACE_COMPOUND_INDEX_TENANT);
            exception.printStackTrace();
        }
    }
}
