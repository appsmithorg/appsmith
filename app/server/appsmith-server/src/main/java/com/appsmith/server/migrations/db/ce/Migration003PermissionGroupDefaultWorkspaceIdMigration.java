package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
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
        AggregationOperation matchDocWithWorkspaceIDField = Aggregation.match(where(
                fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).exists(true));
        AggregationOperation wholeProjection = Aggregation.project(PermissionGroup.class);
        AggregationOperation defaultWorkSpaceIDAdd = Aggregation.addFields().addField(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).
                withValueOf(Fields.field(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId))).build();
        AggregationOperation defaultDomainTypeAdd = Aggregation.addFields().addField(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).
                withValueOf(Workspace.class.getSimpleName()).build();
        AggregationOperation defaultWorkspaceIDToNull = Aggregation.addFields().addField(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).
                withValue(null).build();

        AggregationOperation out = Aggregation.out("permissionGroup");

        Aggregation combinedAggregation = Aggregation.newAggregation(
                matchDocWithWorkspaceIDField,
                wholeProjection,
                defaultWorkSpaceIDAdd,
                defaultDomainTypeAdd,
                defaultWorkspaceIDToNull,
                out);

        mongoTemplate.aggregate(combinedAggregation, PermissionGroup.class, PermissionGroup.class);
    }
}
