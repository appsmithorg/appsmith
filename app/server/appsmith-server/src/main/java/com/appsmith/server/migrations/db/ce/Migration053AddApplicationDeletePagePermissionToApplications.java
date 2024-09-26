package com.appsmith.server.migrations.db.ce;

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

/**
 * This class adds a new policy delete:applicationPages to all non deleted applications.
 * The permissionGroups of the new policy is copied from the policy having permission delete application
 * in the same application.
 *
 */
@Slf4j
@ChangeUnit(order = "053", id = "add-app-delete-pages-permission-to-application", author = " ")
@RequiredArgsConstructor
public class Migration053AddApplicationDeletePagePermissionToApplications {

    private final MongoTemplate mongoTemplate;

    private static final String APPLICATION_DELETE_PAGES_VALUE = AclPermission.APPLICATION_DELETE_PAGES.getValue();
    private static final String DELETE_APPLICATIONS_VALUE = AclPermission.DELETE_APPLICATIONS.getValue();

    private static final String POLICIES = "policies";
    private static final String PERMISSION = "permission";
    private static final String PERMISSION_GROUPS = "permissionGroups";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addApplicationDeletePagesPermissionToApplication() {

        // selection of all the applications which have not been deleted.
        Criteria applicationCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        // conditional to match delete:applications permission
        Document equalityConditionDoc = new Document("$eq", List.of("$$this.permission", DELETE_APPLICATIONS_VALUE));

        // filtering the policy from the policies based on equality condition
        Document filterPermissionGroupsDoc = new Document(
                "$filter", new Document().append("input", "$policies").append("cond", equalityConditionDoc));

        // selecting the permissionGroups set present at array index,
        // (the list is dynamically created after filtering policies on permission and then returning permissionGroups)
        Document permissionGroupArrayElementAtDoc = new Document("$arrayElemAt", List.of(filterPermissionGroupsDoc, 0));

        // creating a new policy with permission delete:applicationPages and permissionGroups from delete:app policy
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

        // concatenating existing policies set with the newly created policy which is in set
        Document concatPolicySets = new Document("$concatArrays", List.of("$policies", singletonPolicyList));

        AggregationOperation aggregationOperation = Aggregation.addFields()
                .addFieldWithValue(POLICIES, concatPolicySets)
                .build();

        try {
            mongoTemplate.updateMulti(
                    new Query().addCriteria(applicationCriteria),
                    Aggregation.newUpdate(aggregationOperation),
                    Application.class);
        } catch (Exception exception) {
            log.debug(
                    "Migration with change-id : add-app-delete-pages-permission-to-application failed due to reason {}."
                            + "skipping addition of policy to applications ",
                    exception.getMessage());

            throw exception;
        }
    }
}
