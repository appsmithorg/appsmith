package com.appsmith.server.migrations.db.ce;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.UpdateOptions;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.List;

import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "057", id = "policy-set-to-policy-map")
public class Migration057PolicySetToPolicyMap {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        executeForCollection(mongoTemplate, "actionCollection");
        executeForCollection(mongoTemplate, "application");
        executeForCollection(mongoTemplate, "applicationSnapshot");
        executeForCollection(mongoTemplate, "collection");
        executeForCollection(mongoTemplate, "config");
        executeForCollection(mongoTemplate, "customJSLib");
        executeForCollection(mongoTemplate, "datasource");
        executeForCollection(mongoTemplate, "datasourceStorage");
        executeForCollection(mongoTemplate, "datasourceStorageStructure");
        executeForCollection(mongoTemplate, "mongockChangeLog");
        executeForCollection(mongoTemplate, "mongockLock");
        executeForCollection(mongoTemplate, "newAction");
        executeForCollection(mongoTemplate, "newPage");
        executeForCollection(mongoTemplate, "passwordResetToken");
        executeForCollection(mongoTemplate, "permissionGroup");
        executeForCollection(mongoTemplate, "plugin");
        executeForCollection(mongoTemplate, "sequence");
        executeForCollection(mongoTemplate, "tenant");
        executeForCollection(mongoTemplate, "theme");
        executeForCollection(mongoTemplate, "user");
        executeForCollection(mongoTemplate, "userData");
        executeForCollection(mongoTemplate, "workspace");
    }

    public static void executeForCollection(MongoTemplate mongoTemplate, String collectionName) {
        log.info("Migrating policies to policyMap in {}", collectionName);

        // Add a schema validation rule, so nothing touches `policies` field anymore hereon.
        //   Especially important for horizontally scaled deployments.
        mongoTemplate
                .getDb()
                .runCommand(new Document("collMod", collectionName)
                        .append("validator", new Document("policies", new Document("$exists", false))));

        // The MongoTemplate APIs don't have a good/possible way to represent this "pipeline" update operation.
        // So we have to resort to this pseudo-JSON.
        final String updateSpec =
                """
                {
                  $set: {
                    policyMap: {
                      $arrayToObject: {
                        $map: {
                          input: "$policies",
                          in: {
                            k: "$$this.permission",
                            v: "$$this",
                          }
                        }
                      }
                    }
                  }
                }
                """;

        final MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);

        collection.updateMany(
                where("policies")
                        .exists(true)
                        .and("policyMap")
                        .exists(false)
                        .and("deletedAt")
                        .isNull()
                        .getCriteriaObject(),
                List.of(Document.parse(updateSpec)),
                new UpdateOptions().bypassDocumentValidation(true));

        collection.updateMany(
                where("policies")
                        .exists(true)
                        .and("policyMap")
                        .exists(true)
                        .and("deletedAt")
                        .isNull()
                        .getCriteriaObject(),
                new Document("$unset", new Document("policies", 1)),
                new UpdateOptions().bypassDocumentValidation(true));
    }
}
