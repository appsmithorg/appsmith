package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
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

import java.util.List;

import static com.appsmith.server.migrations.db.ce.Migration047AddMissingFieldsInDefaultAppsmithAiDatasource.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.db.ce.Migration047AddMissingFieldsInDefaultAppsmithAiDatasource.olderCheckForDeletedCriteria;

@Slf4j
@ChangeUnit(order = "053", id = "add-app-delete-pages-permission-to-application", author = " ")
@RequiredArgsConstructor
public class Migration053AddApplicationDeletePagePermissionToApplications {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

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
