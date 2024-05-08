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

    private static final String APPLICATION_DELETE_PAGES_VALUE = AclPermission.APPLICATION_DELETE_PAGES.getValue();
    private static final String DELETE_APPLICATIONS_VALUE = AclPermission.DELETE_APPLICATIONS.getValue();

    private static final String POLICIES = BaseDomain.Fields.policies;
    private static final String PERMISSION = "permission";
    private static final String PERMISSION_GROUPS = "permissionGroups";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addNewPolicyWithPermissionGroupsFromExisting() {

        Criteria applicationCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        Document equalityConditionDoc = new Document("$eq", List.of("$$this.permission", DELETE_APPLICATIONS_VALUE));

        Document filterPermissionGroupsDoc = new Document(
                "$filter", new Document().append("input", "$policies").append("cond", equalityConditionDoc));

        Document permissionGroupArrayElementAtDoc = new Document("$arrayElemAt", List.of(filterPermissionGroupsDoc, 0));

        List<Document> singletonPolicyList = List.of(new Document(PERMISSION, APPLICATION_DELETE_PAGES_VALUE)
                .append(
                        PERMISSION_GROUPS,
                        new Document(
                                "$let",
                                new Document()
                                        .append(
                                                "vars",
                                                new Document("existingPolicy", permissionGroupArrayElementAtDoc))
                                        .append("in", "$$existingPolicy.permissionGroups"))));

        Document concatPolicySets = new Document("$concatArrays", List.of("$policies", singletonPolicyList));

        AggregationOperation aggregationOperation = Aggregation.addFields()
                .addFieldWithValue(POLICIES, concatPolicySets)
                .build();

        try {
            mongoTemplate.updateMulti(
                    new Query().addCriteria(applicationCriteria),
                    Aggregation.newUpdate(aggregationOperation),
                    Application.class);
        } catch (Exception e) {
            log.debug(
                    "Migration050 failed due to reason {}. \n skipping addition of policy to appications ",
                    e.getMessage());
        }
    }
}
