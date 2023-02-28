package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;


@ChangeUnit(order = "004", id = "reset-on-page-load-edges-in-layouts")
public class Migration004ResetOnPageLoadEdgesInLayouts {
    private final MongoTemplate mongoTemplate;

    public Migration004ResetOnPageLoadEdgesInLayouts(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {
    }

    @Execution
    public void executeMigration() {
        UpdateDefinition updateQuery = new Update()
                .unset("unpublishedPage.layouts.0.allOnPageLoadActionEdges")
                .unset("publishedPage.layouts.0.allOnPageLoadActionEdges");

        mongoTemplate.updateMulti(new Query(), updateQuery, NewPage.class);
    }
}
