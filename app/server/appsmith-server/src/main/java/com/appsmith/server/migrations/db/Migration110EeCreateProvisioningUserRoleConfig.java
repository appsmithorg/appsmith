package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.migrations.utils.AppsmithResources;
import com.appsmith.server.solutions.PolicySolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AppsmithRole.PROVISION_ROLE;
import static com.appsmith.server.constants.FieldName.PROVISIONING_CONFIG;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "110-EE", id = "create-provisioning-user-role-config", author = " ")
public class Migration110EeCreateProvisioningUserRoleConfig {
    private final MongoTemplate mongoTemplate;
    private final PolicySolution policySolution;

    public Migration110EeCreateProvisioningUserRoleConfig(MongoTemplate mongoTemplate, PolicySolution policySolution) {
        this.mongoTemplate = mongoTemplate;
        this.policySolution = policySolution;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void createProvisioningUserRoleAndConfig() {
        Tenant tenant = AppsmithResources.getDefaultTenant(mongoTemplate);
        User provisioningUser = AppsmithResources.getProvisionUser(mongoTemplate);
        if (Objects.isNull(provisioningUser)) {
            provisioningUser = createProvisioningUser(tenant);
        }
        Config provisioningConfig = AppsmithResources.getProvisionConfig(mongoTemplate);
        if (Objects.isNull(provisioningConfig)) {
            PermissionGroup provisioningRole = createProvisioningRoleAndAssignToUser(provisioningUser);
            provisioningConfig = createProvisioningConfigWithRole(provisioningRole);
        }

        String provisioningRoleId = provisioningConfig.getConfig().getAsString(DEFAULT_PERMISSION_GROUP);

        Map<String, Policy> defaultTenantPolicyWithProvisioningRole = new HashMap<>();
        PROVISION_ROLE.getPermissions().forEach(permission -> {
            defaultTenantPolicyWithProvisioningRole.put(
                    permission.getValue(),
                    Policy.builder()
                            .permission(permission.getValue())
                            .permissionGroups(Set.of(provisioningRoleId))
                            .build());
        });

        Tenant tenantWithProvisionRolePermission =
                policySolution.addPoliciesToExistingObject(defaultTenantPolicyWithProvisioningRole, tenant);
        mongoTemplate.save(tenantWithProvisionRolePermission);

        Criteria criteriaUsersWhereReadUsersPermissionExists =
                where("policies.permission").is(READ_USERS.getValue()).andOperator(notDeleted());

        Update updateExistingReadUsersPolicy = new Update();
        updateExistingReadUsersPolicy.addToSet("policies.$.permissionGroups", provisioningRoleId);
        mongoTemplate.updateMulti(
                new Query(criteriaUsersWhereReadUsersPermissionExists), updateExistingReadUsersPolicy, User.class);
    }

    private PermissionGroup createProvisioningRoleAndAssignToUser(User user) {
        PermissionGroup provisioningRole = new PermissionGroup();
        provisioningRole.setName(FieldName.PROVISIONING_ROLE);
        provisioningRole.setAssignedToUserIds(Set.of(user.getId()));
        return mongoTemplate.save(provisioningRole);
    }

    private User createProvisioningUser(Tenant tenant) {

        User provisioningUser = new User();
        provisioningUser.setName(FieldName.PROVISIONING_USER);
        provisioningUser.setEmail(FieldName.PROVISIONING_USER);
        provisioningUser.setWorkspaceIds(new HashSet<>());
        provisioningUser.setTenantId(tenant.getId());

        return mongoTemplate.save(provisioningUser);
    }

    private Config createProvisioningConfigWithRole(PermissionGroup provisioningRole) {
        Config provisioningConfig = new Config();
        JSONObject config = new JSONObject();
        config.put(DEFAULT_PERMISSION_GROUP, provisioningRole.getId());
        provisioningConfig.setConfig(config);
        provisioningConfig.setName(PROVISIONING_CONFIG);
        return mongoTemplate.save(provisioningConfig);
    }
}
