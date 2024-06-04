package com.appsmith.server.migrations.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
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

public class V008__createPublicPermissionGroupInstanceConfig extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;
    private RepositoryHelperMethods helperMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        addInstanceConfigPlaceHolder();
    }

    private void addInstanceConfigPlaceHolder() throws JsonProcessingException {
        String sql = "SELECT COUNT(*) FROM config WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, INSTANCE_CONFIG);
        if (count != null && count != 0) {
            return;
        }
        Config instanceAdminConfig = new Config();
        instanceAdminConfig.setName(INSTANCE_CONFIG);
        Config savedInstanceConfig = helperMethods.createConfig(instanceAdminConfig);

        // Create instance management permission group
        PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
        instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
        instanceManagerPermissionGroup.setPermissions(
                Set.of(new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)));
        PermissionGroup savedPermissionGroup = helperMethods.createPermissionGroup(instanceManagerPermissionGroup);

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

        helperMethods.saveConfig(savedInstanceConfig);
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

        Set<Permission> permissions = new HashSet<>(savedPermissionGroup.getPermissions());
        permissions.addAll(Set.of(
                new Permission(savedPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), READ_PERMISSION_GROUP_MEMBERS)));
        savedPermissionGroup.setPermissions(permissions);

        helperMethods.savePermissionGroup(savedPermissionGroup);
    }
}
