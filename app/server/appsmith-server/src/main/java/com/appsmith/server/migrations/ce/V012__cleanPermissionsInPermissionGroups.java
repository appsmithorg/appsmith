package com.appsmith.server.migrations.ce;

import com.appsmith.server.migrations.AppsmithJavaMigration;
import org.springframework.jdbc.core.JdbcTemplate;

public class V012__cleanPermissionsInPermissionGroups extends AppsmithJavaMigration {
    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        String sql = "UPDATE permission_group SET permissions = NULL";
        jdbcTemplate.execute(sql);
    }
}
