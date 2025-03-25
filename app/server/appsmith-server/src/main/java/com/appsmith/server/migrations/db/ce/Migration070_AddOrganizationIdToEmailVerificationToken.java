package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.EmailVerificationToken;
import com.appsmith.server.domains.Organization;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "070", id = "add-organization-id-to-email-verification-token", author = "")
public class Migration070_AddOrganizationIdToEmailVerificationToken {

    private final MongoTemplate mongoTemplate;

    public Migration070_AddOrganizationIdToEmailVerificationToken(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void addOrganizationIdToEmailVerificationToken() {
        log.info("Adding organizationId to EmailVerificationToken documents");

        // Get the first organization (there should be only one at this point)
        Organization organization = mongoTemplate.findOne(new Query(), Organization.class);
        if (organization == null) {
            log.warn("No organization found. Skipping migration.");
            return;
        }

        String organizationId = organization.getId();

        // Update all EmailVerificationToken documents to include the organizationId
        Query query = new Query(where("organizationId").exists(false));
        Update update = new Update().set("organizationId", organizationId);

        long modifiedCount = mongoTemplate
                .updateMulti(query, update, EmailVerificationToken.class)
                .getModifiedCount();
        log.info("Updated {} EmailVerificationToken documents with organizationId", modifiedCount);
    }

    @RollbackExecution
    public void rollbackExecution() {
        log.info("Rollback not supported for this migration");
    }
}
