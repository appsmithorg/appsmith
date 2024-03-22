package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import static org.springframework.data.mongodb.core.aggregation.AggregationUpdate.update;

@ChangeUnit(order = "049", id = "remove-layout-base-fields")
@RequiredArgsConstructor
public class Migration049RemoveLayoutBaseFields {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        mongoTemplate.updateMulti(
                new Query(),
                update().unset("unpublishedPage.layouts.$[].policies")
                        .unset("unpublishedPage.layouts.$[].deleted")
                        .unset("publishedPage.layouts.$[].policies")
                        .unset("publishedPage.layouts.$[].deleted"),
                NewPage.class);
    }
}
