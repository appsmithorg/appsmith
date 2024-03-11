package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.User;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "047", id = "add-missing-index-in-user-collection", author = " ")
public class Migration048AddIndexToUserCollection {

    private final MongoTemplate mongoTemplate;

    public Migration048AddIndexToUserCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addMissingIndexInUserCollection() {

        Index userEmailCreatedAtIndex =
                makeIndex("deleted", "deletedAt", "email", "createdAt").unique().named("user_compound_index");

        ensureIndexes(mongoTemplate, User.class, userEmailCreatedAtIndex);
    }
}
