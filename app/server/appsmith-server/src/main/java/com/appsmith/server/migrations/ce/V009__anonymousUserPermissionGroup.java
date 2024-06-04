package com.appsmith.server.migrations.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import com.fasterxml.jackson.core.JsonProcessingException;
import net.minidev.json.JSONObject;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;

public class V009__anonymousUserPermissionGroup extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;
    private RepositoryHelperMethods helperMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        addAnonymousUserPermissionGroup();
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

        String defaultTenantId = helperMethods.getDefaultTenantId();

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
        PermissionGroup savedPermissionGroup = helperMethods.createPermissionGroup(publicPermissionGroup);

        Config publicPermissionGroupConfig = new Config();
        publicPermissionGroupConfig.setName(FieldName.PUBLIC_PERMISSION_GROUP);

        publicPermissionGroupConfig.setConfig(
                new JSONObject(Map.of(PERMISSION_GROUP_ID, savedPermissionGroup.getId())));

        helperMethods.createConfig(publicPermissionGroupConfig);
    }
}
