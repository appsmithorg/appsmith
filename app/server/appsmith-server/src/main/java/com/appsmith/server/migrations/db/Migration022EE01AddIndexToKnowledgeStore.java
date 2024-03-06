package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.KnowledgeStore;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "022-ee-01", id = "add-index-for-knowledge-store", author = " ")
public class Migration022EE01AddIndexToKnowledgeStore {

    private final MongoTemplate mongoTemplate;

    private final String KNOWLEDGE_STORE_INDEX_NAME = "knowledge_store_compound_index";

    public Migration022EE01AddIndexToKnowledgeStore(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createNewIndexUserGroupName() {
        dropIndexIfExists(mongoTemplate, KnowledgeStore.class, KNOWLEDGE_STORE_INDEX_NAME);

        Index knowledgeStoreIndex = makeIndex(FieldName.APPLICATION_ID, FieldName.DELETED_AT)
                .unique()
                .named(KNOWLEDGE_STORE_INDEX_NAME);

        ensureIndexes(mongoTemplate, KnowledgeStore.class, knowledgeStoreIndex);
    }
}
