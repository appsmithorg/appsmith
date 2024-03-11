package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.User;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

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

        dropIndexIfExists(mongoTemplate, User.class, "user_compound_index");

        Index userEmailCreatedAtIndex =
                makeIndex("deleted", "deletedAt", "email", "createdAt").unique().named("user_compound_index");

        ensureIndexes(mongoTemplate, User.class, userEmailCreatedAtIndex);
    }
}
