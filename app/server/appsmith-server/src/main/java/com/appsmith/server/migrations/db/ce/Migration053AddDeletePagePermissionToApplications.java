package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.mongodb.BasicDBObject;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static com.appsmith.server.migrations.db.ce.Migration047AddMissingFieldsInDefaultAppsmithAiDatasource.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.db.ce.Migration047AddMissingFieldsInDefaultAppsmithAiDatasource.olderCheckForDeletedCriteria;

@Slf4j
@ChangeUnit(order = "053", id = "add-app-delete-pages-permission-to-application", author = " ", runAlways = true)
@RequiredArgsConstructor
public class Migration053AddDeletePagePermissionToApplications {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    public void usingUpdate() {

        String applicationDeletePages = AclPermission.APPLICATION_DELETE_PAGES.getValue();
        String deleteApplications = AclPermission.DELETE_APPLICATIONS.getValue();

        String policies = BaseDomain.Fields.policies;
        String permission = "permission";
        String permissionGroups = "permissionGroups";

        Criteria applicationCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        BasicDBObject equalityCondition =
                new BasicDBObject("$eq", Arrays.asList("$$this.permission", "delete:applications"));

        BasicDBObject filterAndAddPermissionGroupsObject = new BasicDBObject(
                "$arrayElemAt",
                Arrays.asList(
                        new BasicDBObject(
                                "$filter", new BasicDBObject("input", "$policies").append("cond", equalityCondition)),
                        0));

        Update update = new Update()
                .addToSet(
                        policies,
                        new BasicDBObject(
                                "$concatArrays",
                                Arrays.asList(
                                        "$policies",
                                        Collections.singletonList(
                                                new BasicDBObject()
                                                        .append(permission, applicationDeletePages)
                                                        .append(
                                                                permissionGroups,
                                                                new BasicDBObject(
                                                                        "$let",
                                                                        new BasicDBObject()
                                                                                .append(
                                                                                        "vars",
                                                                                        new BasicDBObject()
                                                                                                .append(
                                                                                                        "existingPolicy",
                                                                                                        filterAndAddPermissionGroupsObject))
                                                                                .append(
                                                                                        "in",
                                                                                        "$$existingPolicy.permissionGroups")))))));

        mongoTemplate.updateMulti(new Query().addCriteria(applicationCriteria), update, Application.class);
    }

    public void method3() {

        String applicationDeletePages = AclPermission.APPLICATION_DELETE_PAGES.getValue();
        String deleteApplications = AclPermission.DELETE_APPLICATIONS.getValue();

        String policies = BaseDomain.Fields.policies;
        String permission = "permission";
        String permissionGroups = "permissionGroups";

        List<Document> pipeline = List.of(
                new Document(
                        "$addFields",
                        new Document(
                                "policies",
                                new Document(
                                        "$concatArrays",
                                        List.of(
                                                "$policies",
                                                List.of(
                                                        new Document("permission", applicationDeletePages)
                                                                .append(
                                                                        "permissionGroups",
                                                                        new Document(
                                                                                "$let",
                                                                                new Document()
                                                                                        .append(
                                                                                                "vars",
                                                                                                new Document(
                                                                                                        "existingPolicy",
                                                                                                        new Document(
                                                                                                                "$arrayElemAt",
                                                                                                                List.of(
                                                                                                                        new Document(
                                                                                                                                "$filter",
                                                                                                                                new Document()
                                                                                                                                        .append(
                                                                                                                                                "input",
                                                                                                                                                "$policies")
                                                                                                                                        .append(
                                                                                                                                                "cond",
                                                                                                                                                new Document(
                                                                                                                                                        "$eq",
                                                                                                                                                        List
                                                                                                                                                                .of(
                                                                                                                                                                        "$$this.permission",
                                                                                                                                                                        deleteApplications)))),
                                                                                                                        0))))
                                                                                        .append(
                                                                                                "in",
                                                                                                "$$existingPolicy.permissionGroups")))))))));

        //        AggregationResults<Document> aggregationResults =
        // mongoTemplate.aggregate(Aggregation.newAggregation(pipeline), Application.class, Document.class);

        //        mongoTemplate.updateMulti(
        //            new Query(),
        //            Update.update("policies", aggregationResults.getMappedResults().get(0).get("policies")),
        //            Application.class
        //        );

    }

    @Execution
    public void addNewPolicyWithPermissionGroupsFromExisting() {
        String applicationDeletePages = AclPermission.APPLICATION_DELETE_PAGES.getValue();
        String deleteApplications = AclPermission.DELETE_APPLICATIONS.getValue();

        String policies = BaseDomain.Fields.policies;
        String permission = "permission";
        String permissionGroups = "permissionGroups";

        Criteria applicationCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        AggregationOperation aggregationOperation = Aggregation.addFields()
                .addFieldWithValue(
                        policies,
                        new Document(
                                "$concatArrays",
                                List.of(
                                        "$policies",
                                        List.of(
                                                new Document(permission, applicationDeletePages)
                                                        .append(
                                                                permissionGroups,
                                                                new Document(
                                                                        "$let",
                                                                        new Document()
                                                                                .append(
                                                                                        "vars",
                                                                                        new Document(
                                                                                                "existingPolicy",
                                                                                                new Document(
                                                                                                        "$arrayElemAt",
                                                                                                        List.of(
                                                                                                                new Document(
                                                                                                                        "$filter",
                                                                                                                        new Document()
                                                                                                                                .append(
                                                                                                                                        "input",
                                                                                                                                        "$policies")
                                                                                                                                .append(
                                                                                                                                        "cond",
                                                                                                                                        new Document(
                                                                                                                                                "$eq",
                                                                                                                                                List
                                                                                                                                                        .of(
                                                                                                                                                                "$$this.permission",
                                                                                                                                                                deleteApplications)))),
                                                                                                                0))))
                                                                                .append(
                                                                                        "in",
                                                                                        "$$existingPolicy.permissionGroups")))))))
                .build();

        mongoTemplate.updateMulti(
                new Query().addCriteria(applicationCriteria),
                Aggregation.newUpdate(aggregationOperation),
                Application.class);
    }
}
