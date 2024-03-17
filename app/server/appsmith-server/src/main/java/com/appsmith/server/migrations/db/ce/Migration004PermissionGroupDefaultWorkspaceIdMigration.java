package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "004", id = "migrate-default-workspace-id-to-default-domain-id")
public class Migration004PermissionGroupDefaultWorkspaceIdMigration {
    private final MongoTemplate mongoTemplate;

    public Migration004PermissionGroupDefaultWorkspaceIdMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {}

    @Execution
    public void defaultWorkspaceIdMigration() {
        Query defaultWorkspaceIdExistsQuery =
                query(where(PermissionGroup.Fields.defaultWorkspaceId).exists(true));

        if (mongoTemplate.findOne(defaultWorkspaceIdExistsQuery, PermissionGroup.class) == null) {
            System.out.println("No permissionGroup data to migrate.");
            return;
        }

        UpdateDefinition copyWorkspaceIdToDomainId = AggregationUpdate.update()
                .set(PermissionGroup.Fields.defaultDomainId)
                .toValueOf(Fields.field(PermissionGroup.Fields.defaultWorkspaceId));
        UpdateDefinition addWorkspaceAsDomainType = AggregationUpdate.update()
                .set(PermissionGroup.Fields.defaultDomainType)
                .toValue(Workspace.class.getSimpleName());
        UpdateDefinition makeWorkspaceIdNull = AggregationUpdate.update()
                .set(PermissionGroup.Fields.defaultWorkspaceId)
                .toValue(null);

        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, copyWorkspaceIdToDomainId, PermissionGroup.class);
        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, addWorkspaceAsDomainType, PermissionGroup.class);
        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, makeWorkspaceIdNull, PermissionGroup.class);
    }
}
