package com.appsmith.server.migrations.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.MigrationHelperMethods;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AppsmithRole.TENANT_ADMIN;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;

public class V010__createTenantAndInstanceAdminPermissionGroups extends AppsmithJavaMigration {
    private RepositoryHelperMethods helperMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        addTenantAdminPermissionsToInstanceAdmin();
    }

    private void addTenantAdminPermissionsToInstanceAdmin() throws JsonProcessingException {
        Tenant defaultTenant = helperMethods.getDefaultTenant();

        Config instanceAdminConfiguration = helperMethods.getConfig(INSTANCE_CONFIG);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        PermissionGroup instanceAdminPGBeforeChanges = helperMethods.getPermissionGroup(instanceAdminPermissionGroupId);

        // Give read permission to instanceAdminPg to all the users who have been assigned this permission group
        Map<String, Policy> readPermissionGroupPolicyMap = Map.of(
                READ_PERMISSION_GROUP_MEMBERS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build());
        PermissionGroup instanceAdminPG = MigrationHelperMethods.addPoliciesToExistingObject(
                readPermissionGroupPolicyMap, instanceAdminPGBeforeChanges);

        // Now add admin permissions to the tenant
        Set<Permission> tenantPermissions = TENANT_ADMIN.getPermissions().stream()
                .map(permission -> new Permission(defaultTenant.getId(), permission))
                .collect(Collectors.toSet());
        HashSet<Permission> permissions = new HashSet<>(instanceAdminPG.getPermissions());
        permissions.addAll(tenantPermissions);
        instanceAdminPG.setPermissions(permissions);

        helperMethods.savePermissionGroup(instanceAdminPG);

        Map<String, Policy> tenantPolicy = MigrationHelperMethods.generatePolicyFromPermissionGroupForObject(
                instanceAdminPG, defaultTenant.getId());
        Tenant updatedTenant = MigrationHelperMethods.addPoliciesToExistingObject(tenantPolicy, defaultTenant);
        helperMethods.saveTenant(updatedTenant);
    }
}
