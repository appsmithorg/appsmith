package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.util.Pair;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "043-ee-02", id = "add-default-permission-for-modules", author = "")
public class Migration043EE02AddPermissionsForModuleInstances {

    private static final String POLICIES = Workspace.Fields.policies;
    private static final String ID = Workspace.Fields.id;
    private static final String DEFAULT_PERMISSION_GROUPS = Workspace.Fields.defaultPermissionGroups;
    private final MongoTemplate mongoTemplate;

    public Migration043EE02AddPermissionsForModuleInstances(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPermissionToWorkspaces() {

        updateNewPagePolicies();
    }

    private void updateNewPagePolicies() {
        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("newPage")
                .find(new Document(Map.of("deleted", false, "deletedAt", Map.of("$exists", false))))
                .projection(new Document(Map.of(ID, 1, POLICIES, 1, DEFAULT_PERMISSION_GROUPS, 1)))
                .batchSize(1024);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                NewPage dbNewPage = mongoTemplate.getConverter().read(NewPage.class, doc);

                if (this.checkNewPageHasModuleInstancePolicies(dbNewPage)) {
                    log.debug(
                            "newPage with id: {} already has permissions associated with it, "
                                    + "skipping modules policy addition",
                            dbNewPage.getId());
                    continue;
                }

                // At this point we are guaranteed that the page does not have module instance creation policy
                Set<Policy> existingPolicies = dbNewPage.getPolicies();

                Optional<Policy> pageActionPolicyOptional = existingPolicies.stream()
                        .filter(policy -> PAGE_CREATE_PAGE_ACTIONS.getValue().equals(policy.getPermission()))
                        .findFirst();

                if (pageActionPolicyOptional.isEmpty()) {
                    // If pageActionPolicy is not present, something is wrong with this NewPage
                    // Skip adding module instance policy as well, as we have nothing to copy from
                    log.debug(
                            "newPage with id: {} does not have page action policy, "
                                    + "skipping modules policy addition",
                            dbNewPage.getId());
                    continue;
                }

                Policy pageActionPolicy = pageActionPolicyOptional.get();

                Policy pageModuleInstancePolicy = Policy.builder()
                        .permission(PAGE_CREATE_MODULE_INSTANCES.getValue())
                        .permissionGroups(pageActionPolicy.getPermissionGroups())
                        .build();

                existingPolicies.add(pageModuleInstancePolicy);

                Query newPageUpdateQuery =
                        new Query().addCriteria(where(NewPage.Fields.id).is(dbNewPage.getId()));
                Update newPageUpdate = new Update().set(POLICIES, dbNewPage.getPolicies());
                Pair<Query, Update> updatePair = Pair.of(newPageUpdateQuery, newPageUpdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }

    private boolean checkNewPageHasModuleInstancePolicies(NewPage newPage) {
        // This flag is to check that if new page already has policies with below-mentioned permissions.
        // We can be sure that existence or these permissions are atomic.

        return newPage.getPolicies().stream()
                .map(Policy::getPermission)
                .anyMatch(permission -> PAGE_CREATE_MODULE_INSTANCES.getValue().equals(permission));
    }
}
