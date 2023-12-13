package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.constants.FieldName.PROVISIONING_USER;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "037-ee-01", id = "mark-provision-user-as-system-generated", author = " ")
public class Migration037EE01MarkProvisionUserAsSystemGenerated {
    private final MongoTemplate mongoTemplate;

    public Migration037EE01MarkProvisionUserAsSystemGenerated(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        final Update update = new Update();
        update.set(fieldName(QUser.user.isSystemGenerated), true);
        try {
            // We expect only 1 provisioning user to be present in the system, but we are using updateMulti to be safe.
            UpdateResult result = mongoTemplate.updateMulti(
                    query(where(fieldName(QUser.user.email)).is(PROVISIONING_USER)), update, User.class);
            log.info("Marked {} provisioning user as system generated", result.getModifiedCount());
        } catch (Exception e) {
            log.error("Error while marking provisioning user as system generated", e);
        }
    }
}
