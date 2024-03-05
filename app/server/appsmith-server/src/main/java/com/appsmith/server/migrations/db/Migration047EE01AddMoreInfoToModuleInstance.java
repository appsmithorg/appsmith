package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.QModule;
import com.appsmith.server.domains.QModuleInstance;
import com.appsmith.server.domains.QPackage;
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

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.TRUE;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "047-ee-01", id = "add-more-info-to-module-instance", author = "")
public class Migration047EE01AddMoreInfoToModuleInstance {

    private final MongoTemplate mongoTemplate;

    // Cache to store already fetched module and package information
    private final Map<String, Module> moduleCache = new HashMap<>();
    private final Map<String, Package> packageCache = new HashMap<>();

    public Migration047EE01AddMoreInfoToModuleInstance(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addMoreInfoToModuleInstance() {

        addPackageAndModuleMetadataToModuleInstances();
    }

    private void addPackageAndModuleMetadataToModuleInstances() {

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, ModuleInstance.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("moduleInstance")
                .find(new Document(Map.of("deleted", false, "deletedAt", Map.of("$exists", false))))
                .projection(null)
                .batchSize(4096);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                ModuleInstance moduleInstance = mongoTemplate.getConverter().read(ModuleInstance.class, doc);

                Module module = getOrFetchModuleInfo(moduleInstance.getSourceModuleId());
                if (module == null) {
                    // source module can be null in case of orphan module instance
                    continue;
                }
                Package publishedPackage = getOrFetchPackageInfo(module.getPackageId());
                if (publishedPackage == null) {
                    // Ideally execution should not reach here as module cannot exist without its respective package
                    continue;
                }

                Query moduleInstanceUpdateQuery = new Query()
                        .addCriteria(where(fieldName(QModuleInstance.moduleInstance.id))
                                .is(moduleInstance.getId()));
                Update moduleInstanceUpdate = new Update()
                        .set(fieldName(QModuleInstance.moduleInstance.packageUUID), publishedPackage.getPackageUUID())
                        .set(completeFieldName(QModuleInstance.moduleInstance.moduleUUID), module.getModuleUUID());

                if (!TRUE.equals(moduleInstance.getUnpublishedModuleInstance().getIsValid())) {
                    Map<String, String> invalidStateMap = Map.of(
                            "packageName",
                                    publishedPackage.getPublishedPackage().getName(),
                            "moduleName", module.getPublishedModule().getName());
                    moduleInstanceUpdate.set(
                            completeFieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.invalidState),
                            invalidStateMap);
                }

                Pair<Query, Update> updatePair = Pair.of(moduleInstanceUpdateQuery, moduleInstanceUpdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, ModuleInstance.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }

    private Module getOrFetchModuleInfo(String sourceModuleId) {
        // Check if module information is already in the cache
        Module cachedModule = moduleCache.get(sourceModuleId);
        if (cachedModule != null) {
            return cachedModule;
        }

        // Fetch module information from the database
        Query query = new Query(Criteria.where(fieldName(QModule.module.id)).is(sourceModuleId));
        Module module = mongoTemplate.findOne(query, Module.class);

        // Cache the fetched module information
        moduleCache.put(sourceModuleId, module);

        return module;
    }

    private Package getOrFetchPackageInfo(String sourcePackageId) {
        // Check if package information is already in the cache
        Package cachedPackage = packageCache.get(sourcePackageId);
        if (cachedPackage != null) {
            return cachedPackage;
        }

        // Fetch package information from the database
        Query query = new Query(Criteria.where(fieldName(QPackage.package$.id)).is(sourcePackageId));
        Package publishedPackage = mongoTemplate.findOne(query, Package.class);

        // Cache the fetched package information
        packageCache.put(sourcePackageId, publishedPackage);

        return publishedPackage;
    }
}
