package com.appsmith.server.migrations.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.CommonMethods;
import com.fasterxml.jackson.core.JsonProcessingException;
import net.minidev.json.JSONObject;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_CONFIG;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;

public class V5__createPermissionGroups extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;
    private CommonMethods commonMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        commonMethods = new CommonMethods(jdbcTemplate);
        addInstanceConfigPlaceHolder();
        addAnonymousUserPermissionGroup();
        addTenantAdminPermissionsToInstanceAdmin();
    }

    private void addInstanceConfigPlaceHolder() throws JsonProcessingException {
        String sql = "SELECT COUNT(*) FROM config WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, INSTANCE_CONFIG);
        if (count != null && count != 0) {
            return;
        }
        Config instanceAdminConfig = new Config();
        instanceAdminConfig.setName(INSTANCE_CONFIG);
        Config savedInstanceConfig = commonMethods.createConfig(instanceAdminConfig);

        // Create instance management permission group
        PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
        instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
        PermissionGroup savedPermissionGroup = commonMethods.createPermissionGroup(instanceManagerPermissionGroup);

        // Update the instance config with the permission group id
        instanceAdminConfig.setConfig(
                new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, instanceManagerPermissionGroup.getId())));

        Policy editConfigPolicy = Policy.builder()
                .permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy readConfigPolicy = Policy.builder()
                .permission(READ_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedInstanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)));

        commonMethods.saveConfig(savedInstanceConfig);
        // Also give the permission group permission to unassign & assign & read to itself
        Policy updatePermissionGroupPolicy = Policy.builder()
                .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        Policy assignPermissionGroupPolicy = Policy.builder()
                .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedPermissionGroup.setPolicies(
                new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)));

        commonMethods.savePermissionGroup(savedPermissionGroup);
    }

    private void addAnonymousUserPermissionGroup() throws JsonProcessingException {
        String sql = "SELECT COUNT(*) FROM config WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, FieldName.PUBLIC_PERMISSION_GROUP);
        if (count != null && count != 0) {
            return;
        }
        PermissionGroup publicPermissionGroup = new PermissionGroup();
        publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
        publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");

        String defaultTenantId = commonMethods.getDefaultTenantId();

        String anonymousUserId = jdbcTemplate.queryForObject(
                "SELECT id FROM \"user\" WHERE email = ? and tenant_id = ?",
                String.class,
                FieldName.ANONYMOUS_USER,
                defaultTenantId);

        if (anonymousUserId == null) {
            throw new IllegalStateException("Anonymous user not found in the database");
        }

        // Give access to anonymous user to the permission group.
        publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUserId));
        PermissionGroup savedPermissionGroup = commonMethods.createPermissionGroup(publicPermissionGroup);

        Config publicPermissionGroupConfig = new Config();
        publicPermissionGroupConfig.setName(FieldName.PUBLIC_PERMISSION_GROUP);

        publicPermissionGroupConfig.setConfig(
                new JSONObject(Map.of(PERMISSION_GROUP_ID, savedPermissionGroup.getId())));

        commonMethods.createConfig(publicPermissionGroupConfig);
    }

    private void addTenantAdminPermissionsToInstanceAdmin() throws JsonProcessingException {
        Tenant defaultTenant = commonMethods.getDefaultTenant();

        Config instanceAdminConfiguration = commonMethods.getConfig(INSTANCE_CONFIG);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        PermissionGroup instanceAdminPGBeforeChanges = commonMethods.getPermissionGroup(instanceAdminPermissionGroupId);

        // Give read permission to instanceAdminPg to all the users who have been assigned this permission group
        Map<String, Policy> readPermissionGroupPolicyMap = Map.of(
                READ_PERMISSION_GROUP_MEMBERS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build());
        PermissionGroup instanceAdminPG =
                commonMethods.addPoliciesToExistingObject(readPermissionGroupPolicyMap, instanceAdminPGBeforeChanges);

        commonMethods.savePermissionGroup(instanceAdminPG);

        Map<String, Policy> tenantPolicy =
                commonMethods.generatePolicyFromPermissionGroupForObject(instanceAdminPG, defaultTenant.getId());
        Tenant updatedTenant = commonMethods.addPoliciesToExistingObject(tenantPolicy, defaultTenant);
        commonMethods.saveTenant(updatedTenant);
    }
}
