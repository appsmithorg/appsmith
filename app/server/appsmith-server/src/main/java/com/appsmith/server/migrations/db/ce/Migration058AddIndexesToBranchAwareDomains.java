package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "058", id = "add-idx-branch-aware", author = " ")
public class Migration058AddIndexesToBranchAwareDomains {

    private final MongoTemplate mongoTemplate;

    public Migration058AddIndexesToBranchAwareDomains(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        String indexName = "baseId_branchName_compound_index";

        Index index = makeIndex("baseId", "branchName", "deleted", "deletedAt").named(indexName);

        // NewPage
        Mono<Boolean> newPageMono = Mono.fromCallable(() -> {
                    log.debug("Fixing NewPage indices");
                    createNewPageIndex(indexName, index);
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());

        // NewAction
        Mono<Boolean> newActionMono = Mono.fromCallable(() -> {
                    log.debug("Fixing NewAction indices");
                    createNewActionIndex(indexName, index);
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());

        // ActionCollection
        Mono<Boolean> actionCollectionMono = Mono.fromCallable(() -> {
                    log.debug("Fixing ActionCollection indices");
                    createActionCollectionIndex(indexName, index);
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic());

        Mono.zip(newPageMono, newActionMono, actionCollectionMono).block();
    }

    private void createNewPageIndex(String indexName, Index index) {

        try {
            dropIndexIfExists(mongoTemplate, NewPage.class, "defaultApplicationId_gitSyncId_deleted");
            dropIndexIfExists(mongoTemplate, NewPage.class, "defaultPageId_branchName_deleted_compound_index");
            dropIndexIfExists(mongoTemplate, NewPage.class, indexName);

            ensureIndexes(mongoTemplate, NewPage.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    indexName,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", indexName, e);
        }
    }

    private void createNewActionIndex(String indexName, Index index) {

        try {
            dropIndexIfExists(mongoTemplate, NewAction.class, "defaultActionId_branchName_deleted_compound_index");
            dropIndexIfExists(mongoTemplate, NewAction.class, "defaultApplicationId_gitSyncId_deleted");
            dropIndexIfExists(mongoTemplate, NewAction.class, indexName);

            ensureIndexes(mongoTemplate, NewAction.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    indexName,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", indexName, e);
        }
    }

    private void createActionCollectionIndex(String indexName, Index index) {

        try {
            dropIndexIfExists(mongoTemplate, ActionCollection.class, "defaultCollectionId_branchName_deleted");
            dropIndexIfExists(mongoTemplate, ActionCollection.class, "defaultApplicationId_gitSyncId_deleted");
            dropIndexIfExists(mongoTemplate, ActionCollection.class, "unpublishedCollection.defaultResources.pageId");
            dropIndexIfExists(mongoTemplate, ActionCollection.class, indexName);

            ensureIndexes(mongoTemplate, ActionCollection.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    indexName,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", indexName, e);
        }
    }
}
