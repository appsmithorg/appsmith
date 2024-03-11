package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.User;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;

@Slf4j
@ChangeUnit(order = "048", id = "add-compound-index-in-user-collection", author = " ")
public class Migration048AddCompoundIndexToUserEntity {

    private final MongoTemplate mongoTemplate;

    public Migration048AddCompoundIndexToUserEntity(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addMissingIndexInUserCollection() {

        // Prod index name
        dropIndexIfExists(mongoTemplate, User.class, "deleted_1_deletedAt_1_email_1_createdAt_-1");
        dropIndexIfExists(mongoTemplate, User.class, "user_deleted_deletedAt_email_createdAt_compound_index");

        org.bson.Document doc = new org.bson.Document();
        doc.put("deleted", 1);
        doc.put("deletedAt", 1);
        doc.put("email", 1);
        doc.put("createdAt", -1);
        Index userCompoundIndex =
                new CompoundIndexDefinition(doc).named("user_deleted_deletedAt_email_createdAt_compound_index");

        ensureIndexes(mongoTemplate, User.class, userCompoundIndex);
    }
}
