package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
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
@ChangeUnit(order = "037", id = "add-compound-index-name-deleted", author = " ")
public class Migration037AddCompoundIndexForNameAndDeletedAt {

    private final MongoTemplate mongoTemplate;

    private static final String NAME_DELETED_COMPOUND_INDEX = "name_deleted_compound_index";

    public Migration037AddCompoundIndexForNameAndDeletedAt(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexInWorkspaceAndApplicationsCollection() {

        Index namedDeletedAtIndex = makeIndex(FieldName.NAME, FieldName.DELETED, FieldName.DELETED_AT)
                .named(NAME_DELETED_COMPOUND_INDEX);

        try {
            dropIndexIfExists(mongoTemplate, Workspace.class, NAME_DELETED_COMPOUND_INDEX);
            ensureIndexes(mongoTemplate, Workspace.class, namedDeletedAtIndex);

            dropIndexIfExists(mongoTemplate, Application.class, NAME_DELETED_COMPOUND_INDEX);
            ensureIndexes(mongoTemplate, Application.class, namedDeletedAtIndex);
        } catch (UncategorizedMongoDbException mongockException) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    NAME_DELETED_COMPOUND_INDEX,
                    mongockException.getMessage());
        } catch (Exception exception) {
            log.error("An error occurred while creating the index : {}", NAME_DELETED_COMPOUND_INDEX, exception);
        }
    }
}
