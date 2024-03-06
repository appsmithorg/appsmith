package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.QModule;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.util.Pair;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "047-ee-02", id = "add-git-sync-id-to-existing-modules", author = "")
public class Migration047EE02AddGitSyncIdToExistingModules {

    private final MongoTemplate mongoTemplate;

    public Migration047EE02AddGitSyncIdToExistingModules(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addGitSyncIdToModules() {

        addGitSyncIdToExistingModules();
    }

    private void addGitSyncIdToExistingModules() {

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Module.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("module")
                .find(new Document(Map.of(
                        "deleted",
                        false,
                        "deletedAt",
                        Map.of("$exists", false),
                        Module.Fields.originModuleId,
                        Map.of("$exists", false))))
                .projection(null)
                .batchSize(4096);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                Module module = mongoTemplate.getConverter().read(Module.class, doc);

                module.setGitSyncId(module.getPackageId() + "_" + new ObjectId());

                Query moduleUpdateQuery = new Query()
                        .addCriteria(where(fieldName(QModule.module.id)).is(module.getId()));
                Update moduleUPdate = new Update().set(fieldName(QModule.module.gitSyncId), module.getGitSyncId());

                Pair<Query, Update> updatePair = Pair.of(moduleUpdateQuery, moduleUPdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Module.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }
}
