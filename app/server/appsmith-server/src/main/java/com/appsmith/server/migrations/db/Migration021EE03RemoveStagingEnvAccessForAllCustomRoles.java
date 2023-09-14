package com.appsmith.server.migrations.db;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.ArrayList;
import java.util.List;

import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.olderCheckForDeletedCriteria;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "021-ee-03", id = "remove-staging-access-for-custom-roles", author = " ")
public class Migration021EE03RemoveStagingEnvAccessForAllCustomRoles {
    private final MongoTemplate mongoTemplate;

    public Migration021EE03RemoveStagingEnvAccessForAllCustomRoles(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() {

        // First get the value of publicPermissionGroupId for this instance, this is anon user
        String publicPermissionGroupId = getPublicPermissionGroupId();

        // Fetch all app viewer permissions across the board
        Criteria appViewerPermissionGroupsCriteria = new Criteria()
                .andOperator(
                        olderCheckForDeletedCriteria(),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                .in("Application", "Workspace"),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.name))
                                .regex("^App Viewer"));
        Query appViewerPermissionGroupsQuery = new Query().addCriteria(appViewerPermissionGroupsCriteria);
        appViewerPermissionGroupsQuery.fields().include(fieldName(QPermissionGroup.permissionGroup.id));

        List<String> appViewerPermissionGroupIds = mongoTemplate.stream(
                        appViewerPermissionGroupsQuery, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .toList();

        final ArrayList<String> finalPermissionGroupIdsToRemove = new ArrayList<>(appViewerPermissionGroupIds);

        finalPermissionGroupIdsToRemove.add(publicPermissionGroupId);

        // Find all staging environments with execute permissions
        Criteria applicableEnvironmentsCriteria = new Criteria()
                .andOperator(
                        olderCheckForDeletedCriteria(),
                        newerCheckForDeletedCriteria(),
                        Criteria.where(fieldName(QEnvironment.environment.policies))
                                .elemMatch(new Criteria()
                                        .andOperator(Criteria.where("permission")
                                                .is(AclPermission.EXECUTE_ENVIRONMENTS.getValue())))
                                .and("policies.permissionGroups")
                                .exists(true),
                        Criteria.where(fieldName(QEnvironment.environment.name))
                                .is(CommonFieldName.STAGING_ENVIRONMENT));
        Query query = new Query().addCriteria(applicableEnvironmentsCriteria);

        Update environmentUpdateQuery =
                new Update().pullAll("policies.$[].permissionGroups", finalPermissionGroupIdsToRemove.toArray());

        mongoTemplate.updateMulti(query, environmentUpdateQuery, Environment.class);
    }

    private String getPublicPermissionGroupId() {
        Criteria publicPermissionGroupCriterion =
                Criteria.where(fieldName(QConfig.config1.name)).is(PUBLIC_PERMISSION_GROUP);
        Query publicPermissionGroupQuery = new Query().addCriteria(publicPermissionGroupCriterion);
        Config publicPermissionGroupConfig = mongoTemplate.findOne(publicPermissionGroupQuery, Config.class);
        String publicPermissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);
        return publicPermissionGroupId;
    }
}
