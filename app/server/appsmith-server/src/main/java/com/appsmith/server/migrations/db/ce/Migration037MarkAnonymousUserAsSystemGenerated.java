package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.User;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Update;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "037", id = "mark-anonymous-user-as-system-generated", author = " ")
public class Migration037MarkAnonymousUserAsSystemGenerated {
    private final MongoTemplate mongoTemplate;

    public Migration037MarkAnonymousUserAsSystemGenerated(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        final Update update = new Update();
        update.set(User.Fields.isSystemGenerated, true);
        try {
            // We expect only 1 anonymous user to be present in the system, but we are using updateMulti to be safe.
            UpdateResult result = mongoTemplate.updateMulti(
                    query(where(User.Fields.isAnonymous).is(true)), update, User.class);
            log.info("Marked {} anonymous users as system generated", result.getModifiedCount());
        } catch (Exception e) {
            log.error("Error while marking anonymous user as system generated", e);
        }
    }
}
