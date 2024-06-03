package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "056", id = "add-unique-index-for-slug-in-tenant")
public class Migration056AddUniqueIndexForSlugInTenant {
    private final MongoTemplate mongoTemplate;

    public Migration056AddUniqueIndexForSlugInTenant(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() {
        ensureIndexes(mongoTemplate, Tenant.class, makeIndex(Tenant.Fields.slug));
    }
}
