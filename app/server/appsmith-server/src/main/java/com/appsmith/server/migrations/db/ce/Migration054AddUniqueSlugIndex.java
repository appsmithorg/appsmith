package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;

@Slf4j
@ChangeUnit(order = "054", id = "create-unique-index-tenant-slug", author = " ")
public class Migration053AddUniqueSlugIndex {

    private final MongoTemplate mongoTemplate;

    public Migration053AddUniqueSlugIndex(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Implement rollback logic if necessary. For now, it does nothing.
    }

    @Execution
    public void addUniqueSlugIndex() {
        String slugIndexName = "slug_unique_index";

        // Drop existing slug index if it exists
        dropIndexIfExists(mongoTemplate, Tenant.class, slugIndexName);
        dropIndexIfExists(mongoTemplate, Tenant.class, "slug_1");

        // Create a new unique index on the slug field
         // Sort order: Sort.Direction.ASC ensures the slugs are sorted in ascending order (A to Z).
        // Uniqueness: .unique() makes sure each slug value is unique within the collection. This is useful to avoid
        // duplicate URLs or identifiers based on slugs.
        Index slugIndex =
                new Index().on(Tenant.Fields.slug, Sort.Direction.ASC).unique().named(slugIndexName);
        ensureIndexes(mongoTemplate, Tenant.class, slugIndex);
    }
}
