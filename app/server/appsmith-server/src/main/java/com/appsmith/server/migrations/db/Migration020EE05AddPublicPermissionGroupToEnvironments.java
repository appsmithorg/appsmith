package com.appsmith.server.migrations.db;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.olderCheckForDeletedCriteria;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "020-ee-05", id = "add-public-perm-to-envs")
public class Migration020EE05AddPublicPermissionGroupToEnvironments {

    private final MongoTemplate mongoTemplate;

    public Migration020EE05AddPublicPermissionGroupToEnvironments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
        // We are only going to be updating environments that
        // do not have the public permission group yet
        // Hence we don't need roll back, re-running will work
    }

    @Execution
    public void executeMigration() {
        // First get the value of publicPermissionGroupId for this instance
        Criteria publicPermissionGroupCriterion =
                Criteria.where(fieldName(QConfig.config1.name)).is(PUBLIC_PERMISSION_GROUP);
        Query publicPermissionGroupQuery = new Query().addCriteria(publicPermissionGroupCriterion);
        Config publicPermissionGroupConfig = mongoTemplate.findOne(publicPermissionGroupQuery, Config.class);
        String publicPermissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        // Get a set of all the workspaceIds
        // that have any applications that have been set to public
        Criteria publicApplicationsCriteria = new Criteria()
                .andOperator(
                        olderCheckForDeletedCriteria(),
                        newerCheckForDeletedCriteria(),
                        Criteria.where(fieldName(QApplication.application.policies))
                                .elemMatch(new Criteria()
                                        .andOperator(
                                                Criteria.where("permission")
                                                        .is(AclPermission.READ_APPLICATIONS.getValue()),
                                                Criteria.where("permissionGroups")
                                                        .in(publicPermissionGroupId))))
                .and("policies.permissionGroups")
                .exists(true);

        Query publicApplicationsQuery = new Query().addCriteria(publicApplicationsCriteria);
        publicApplicationsQuery.fields().include(fieldName(QApplication.application.workspaceId));

        final Query performanceOptimizedpublicApplicationsQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, publicApplicationsQuery, Application.class);

        Set<String> workspaceIds =
                mongoTemplate.find(performanceOptimizedpublicApplicationsQuery, Application.class).parallelStream()
                        .map(application -> application.getWorkspaceId())
                        .collect(Collectors.toSet());

        // Now use an update many to update all applicable environments
        // with the public permission group for the execute permission
        Criteria applicableEnvironmentsCriteria = new Criteria()
                .andOperator(
                        olderCheckForDeletedCriteria(),
                        newerCheckForDeletedCriteria(),
                        Criteria.where(fieldName(QEnvironment.environment.name))
                                .is(CommonFieldName.PRODUCTION_ENVIRONMENT),
                        Criteria.where(fieldName(QEnvironment.environment.workspaceId))
                                .in(workspaceIds),
                        // We're adding this last criterion to avoid updating environments that are already updated
                        // In case of re-runs
                        Criteria.where(fieldName(QEnvironment.environment.policies))
                                .elemMatch(new Criteria()
                                        .andOperator(
                                                Criteria.where("permission")
                                                        .is(AclPermission.EXECUTE_ENVIRONMENTS.getValue()),
                                                Criteria.where("permissionGroups")
                                                        .nin(publicPermissionGroupId))))
                .and("policies.permissionGroups")
                .exists(true);
        Query applicableEnvironmentsQuery = new Query().addCriteria(applicableEnvironmentsCriteria);

        Update environmentUpdateQuery = new Update().addToSet("policies.$.permissionGroups", publicPermissionGroupId);

        mongoTemplate.updateMulti(applicableEnvironmentsQuery, environmentUpdateQuery, Environment.class);
    }
}
