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
import static org.springframework.data.domain.Sort.Direction.ASC;

@Slf4j
@ChangeUnit(order = "067", id = "update-user-email-index")
public class Migration067_UpdateUserEmailIndex {

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute(MongoTemplate mongoTemplate) {
        log.info("Starting migration to update user email index");
        try {
            // Drop the existing email index
            dropIndexIfExists(mongoTemplate, User.class, "email");

            // Create new compound index on email and organizationId
            Index emailOrgIndex = new Index()
                    .on("email", ASC)
                    .on("organizationId", ASC)
                    .unique()
                    .named("email_organizationId_compound_index");

            ensureIndexes(mongoTemplate, User.class, emailOrgIndex);

            log.info("Completed migration to update user email index");
        } catch (Exception e) {
            log.error("Error updating user email index", e);
            throw e;
        }
    }
}
