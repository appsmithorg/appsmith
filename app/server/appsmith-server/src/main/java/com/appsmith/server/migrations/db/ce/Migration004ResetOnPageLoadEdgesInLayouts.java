package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

/**
 * Since an Appsmith application is not limited by the number of interconnections it can make,
 * it is possible for users to create graphs so complex that we end up having MBs of data in a
 * relatively simple page as well.
 * This was causing failures in a user's app since they were now unable to update their app
 * any further. We do not really use this property anywhere in our logic today,
 * and this is essentially redundant information.
 * This migration gets rid of the edges property from the layout in all existing pages.
 */
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
