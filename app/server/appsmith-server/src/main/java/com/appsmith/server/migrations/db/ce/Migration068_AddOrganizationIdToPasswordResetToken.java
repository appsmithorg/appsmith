package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Arrays;
import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(id = "add-organization-id-to-password-reset-token", order = "068")
public class Migration068_AddOrganizationIdToPasswordResetToken {

    private final MongoTemplate mongoTemplate;

    public Migration068_AddOrganizationIdToPasswordResetToken(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        try {
            // Get the organization ID from the organization collection
            Document organization = mongoTemplate.findOne(new Query(), Document.class, "organization");
            if (organization == null) {
                log.info("No organization found to migrate password reset tokens");
                return;
            }
            String organizationId = organization.getObjectId("_id").toString();

            // Update all password reset tokens that don't have an organizationId
            Query query = new Query(where("organizationId").exists(false));
            List<Document> pipeline =
                    Arrays.asList(new Document("$set", new Document("organizationId", organizationId)));

            long updatedCount = mongoTemplate
                    .getCollection("passwordResetToken")
                    .updateMany(query.getQueryObject(), pipeline)
                    .getModifiedCount();

            log.info("Successfully set organizationId for {} password reset token documents", updatedCount);
        } catch (Exception e) {
            log.error("Error while setting organizationId for password reset tokens: ", e);
            throw e;
        }
    }
}
