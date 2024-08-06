package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "057", id = "move-dr-to-base-ids", author = " ")
public class Migration057MoveDRToBaseIds {

    private final MongoTemplate mongoTemplate;

    public Migration057MoveDRToBaseIds(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        Query findQuery = query(where(BaseDomain.Fields.deletedAt)
                .isNull()
                .and(BranchAwareDomain.Fields.branchName)
                .exists(false));

        // NewPage
        AggregationUpdate moveNewPageDRUpdateQuery = getUpdateDefinition("defaultResources.pageId");
        Mono<UpdateResult> newPageMono = Mono.fromCallable(() -> {
                    log.debug("NewPage");
                    return mongoTemplate.updateMulti(findQuery, moveNewPageDRUpdateQuery, NewPage.class);
                })
                .subscribeOn(Schedulers.boundedElastic());

        // NewAction
        AggregationUpdate moveNewActionDRUpdateQuery = getUpdateDefinition("defaultResources.actionId");
        Mono<UpdateResult> newActionMono = Mono.fromCallable(() -> {
                    log.debug("NewAction");
                    return mongoTemplate.updateMulti(findQuery, moveNewActionDRUpdateQuery, NewAction.class);
                })
                .subscribeOn(Schedulers.boundedElastic());

        // ActionCollection
        AggregationUpdate moveActionCollectionDRUpdateQuery = getUpdateDefinition("defaultResources.collectionId");
        Mono<UpdateResult> actionCollectionMono = Mono.fromCallable(() -> {
                    log.debug("ActionCollection");
                    return mongoTemplate.updateMulti(
                            findQuery, moveActionCollectionDRUpdateQuery, ActionCollection.class);
                })
                .subscribeOn(Schedulers.boundedElastic());

        Mono.zip(newPageMono, newActionMono, actionCollectionMono).block();
    }

    @NotNull private AggregationUpdate getUpdateDefinition(String oldBaseIdPath) {
        return AggregationUpdate.update()
                .set(BranchAwareDomain.Fields.baseId)
                .toValueOf(Fields.field(oldBaseIdPath))
                .set(BranchAwareDomain.Fields.branchName)
                .toValueOf(Fields.field("defaultResources.branchName"));
    }
}
