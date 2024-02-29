package com.appsmith.server.migrations.db;

import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.domains.QNewAction;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.util.Pair;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.models.CreatorContextType.MODULE;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "045-ee-01", id = "add-package-id-to-module-entities", author = "")
public class Migration045EE01AddPackageIdToModuleEntities {

    private final MongoTemplate mongoTemplate;

    // Cache to store already fetched module and package information
    private final Map<String, Module> moduleCache = new HashMap<>();

    public Migration045EE01AddPackageIdToModuleEntities(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPackageIdToModuleEntities() {

        Stopwatch stopwatch = new Stopwatch("Add `packageId` to module entities migration");
        addPackageIdToNewAction();
        addPackageIdToActionCollection();
        stopwatch.stopAndLogTimeInMillis();
    }

    private void addPackageIdToNewAction() {

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, NewAction.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("newAction")
                .find(new Document(Map.of(
                        "deleted",
                        false,
                        "deletedAt",
                        Map.of("$exists", false),
                        completeFieldName(QNewAction.newAction.unpublishedAction.moduleId),
                        Map.of("$exists", true),
                        completeFieldName(QNewAction.newAction.unpublishedAction.contextType),
                        MODULE)))
                .projection(null)
                .batchSize(4096);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                NewAction newAction = mongoTemplate.getConverter().read(NewAction.class, doc);

                Module module =
                        getOrFetchModuleInfo(newAction.getUnpublishedAction().getModuleId());

                Query newActionUpdateQuery = new Query()
                        .addCriteria(where(fieldName(QNewAction.newAction.id)).is(newAction.getId()));
                Update newActionUpdate =
                        new Update().set(fieldName(QNewAction.newAction.packageId), module.getPackageId());

                Pair<Query, Update> updatePair = Pair.of(newActionUpdateQuery, newActionUpdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, NewAction.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }

    private void addPackageIdToActionCollection() {

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, ActionCollection.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("actionCollection")
                .find(new Document(Map.of(
                        "deleted",
                        false,
                        "deletedAt",
                        Map.of("$exists", false),
                        completeFieldName(QActionCollection.actionCollection.unpublishedCollection.moduleId),
                        Map.of("$exists", true),
                        completeFieldName(QActionCollection.actionCollection.unpublishedCollection.contextType),
                        MODULE)))
                .projection(null)
                .batchSize(4096);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                ActionCollection actionCollection = mongoTemplate.getConverter().read(ActionCollection.class, doc);

                Module module = getOrFetchModuleInfo(
                        actionCollection.getUnpublishedCollection().getModuleId());

                Query actionCollectionUpdateQuery = new Query()
                        .addCriteria(where(fieldName(QActionCollection.actionCollection.id))
                                .is(actionCollection.getId()));
                Update actionCollectionUpdate = new Update()
                        .set(fieldName(QActionCollection.actionCollection.packageId), module.getPackageId());

                Pair<Query, Update> updatePair = Pair.of(actionCollectionUpdateQuery, actionCollectionUpdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, ActionCollection.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }

    private Module getOrFetchModuleInfo(String moduleId) {
        // Check if module information is already in the cache
        Module cachedModule = moduleCache.get(moduleId);
        if (cachedModule != null) {
            return cachedModule;
        }

        // Fetch module information from the database
        Query query = new Query(Criteria.where(fieldName(QModule.module.id)).is(moduleId));
        Module module = mongoTemplate.findOne(query, Module.class);

        // Cache the fetched module information
        moduleCache.put(moduleId, module);

        return module;
    }
}
