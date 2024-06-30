package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.mongodb.client.model.UpdateOptions;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.ArrayOperators;
import org.springframework.data.mongodb.core.aggregation.VariableOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.where;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "057", id = "policy-set-to-policy-map", runAlways = true)
public class Migration057PolicySetToPolicyMap {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        executeForCollection("tenant");
    }

    public void executeForCollection(String collectionName) {
        // Add a schema validation rule, so nothing touches `policies` field anymore hereon.
        //   Especially important for horizontally scaled deployments.

        mongoTemplate
                .getDb()
                .runCommand(new Document("collMod", collectionName)
                        .append("validator", new Document("policies", new Document("$exists", false))));

        final Criteria criteria = where("policies")
                .exists(true)
                .and("policyMap")
                .exists(false)
                .and(FieldName.DELETED_AT)
                .isNull();

        final ArrayOperators.ArrayToObject setToMap =
                ArrayOperators.ArrayToObject.arrayValueOfToObject(VariableOperators.Map.itemsOf("policies")
                        .as("this")
                        .andApply(agg -> new Document("k", "$$this.permission").append("v", "$$this")));

        // mongoTemplate.updateMulti(new Query(criteria), update().set("policyMap").toValueOf(setToMap),
        // collectionName);

        /*mongoTemplate.getCollection(collectionName).updateMany(
            new Query(criteria).getQueryObject().toBsonDocument(),
            List.of(Document.parse("""
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
                        },
                    }
                """)),
            new UpdateOptions().bypassDocumentValidation(true)
        );//*/

        /*mongoTemplate
        .getCollection(collectionName)
        .updateMany(
                new Query(criteria).getQueryObject().toBsonDocument(),
                List.of(new Document(
                        "$set",
                        new Document(
                                "policies",
                                new Document(
                                        "$arrayToObject",
                                        new Document(
                                                "$map",
                                                new Document("input", "$policies")
                                                        .append(
                                                                "in",
                                                                new Document("k", "$$this.permission")
                                                                        .append("v", "$$this"))))))),
                new UpdateOptions().bypassDocumentValidation(true)); // */

        mongoTemplate
                .getDb()
                .runCommand(
                        new Document("update", collectionName)
                                .append("bypassDocumentValidation", true)
                                .append(
                                        "updates",
                                        List.of(
                                                new Document()
                                                        .append(
                                                                "q",
                                                                new Query(criteria)
                                                                        .getQueryObject()
                                                                        .toBsonDocument())
                                                        .append(
                                                                "u",
                                                                List.of(
                                                                        Document.parse(
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
                    },
                }
            """)))))); // */

        // mongoTemplate.updateMulti(new Query(where("policyMap").exists(true).and(FieldName.DELETED_AT).isNull()),
        // update().unset("policies").withOptions(UpdateOptions), collectionName);

        mongoTemplate
                .getCollection(collectionName)
                .updateMany(
                        new Document("policyMap", new Document("$exists", true))
                                .append("policies", new Document("$exists", true)),
                        new Document("$unset", new Document("policies", 1)),
                        new UpdateOptions().bypassDocumentValidation(true));
    }
}
