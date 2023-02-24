package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;


@ChangeUnit(order = "003", id="migrate-default-workspace-id-to-default-domain-id")
public class Migration003PermissionGroupDefaultWorkspaceIdMigration {
    private final MongoTemplate mongoTemplate;

    public Migration003PermissionGroupDefaultWorkspaceIdMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {
    }

    @Execution
    public void defaultWorkspaceIdMigration() {
        Query defaultWorkspaceIdExistsQuery = query(where(
                fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).exists(true));
        UpdateDefinition copyWorkspaceIdToDomainId = AggregationUpdate.update()
                .set(fieldName(QPermissionGroup.permissionGroup.defaultDomainId))
                .toValueOf(Fields.field(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)));
        UpdateDefinition addWorkspaceAsDomainType = AggregationUpdate.update()
                .set(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                .toValue(Workspace.class.getSimpleName());
        UpdateDefinition makeWorkspaceIdNull = AggregationUpdate.update()
                .set(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId))
                        .toValue(null);

        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, copyWorkspaceIdToDomainId, PermissionGroup.class);
        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, addWorkspaceAsDomainType, PermissionGroup.class);
        mongoTemplate.updateMulti(defaultWorkspaceIdExistsQuery, makeWorkspaceIdNull, PermissionGroup.class);
    }
}
