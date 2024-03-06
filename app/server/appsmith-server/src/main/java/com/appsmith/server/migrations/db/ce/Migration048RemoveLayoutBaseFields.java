package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import static org.springframework.data.mongodb.core.aggregation.AggregationUpdate.update;

@Slf4j
@ChangeUnit(order = "047", id = "remove-layout-base-fields", author = " ")
@RequiredArgsConstructor
public class Migration048RemoveLayoutBaseFields {
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
