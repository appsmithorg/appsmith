package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Organization;
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
@ChangeUnit(order = "073", id = "add-unique-index-on-organization-slug", author = "")
public class Migration073_AddUniqueIndexOnOrganizationSlug {

    private final MongoTemplate mongoTemplate;

    public Migration073_AddUniqueIndexOnOrganizationSlug(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // No rollback necessary
    }

    @Execution
    public void addUniqueIndexOnOrganizationSlug() {
        log.info("Adding unique index on organization slug field");
        try {
            // First drop the index if it exists (to ensure idempotence)
            dropIndexIfExists(mongoTemplate, Organization.class, "slug");

            // Create unique index on the slug field
            Index slugIndex = makeIndex("slug").named("slug").unique().background();

            ensureIndexes(mongoTemplate, Organization.class, slugIndex);

            log.info("Successfully added unique index on organization slug field");
        } catch (Exception e) {
            log.error("Error adding unique index on organization slug field", e);
            throw e;
        }
    }
}
