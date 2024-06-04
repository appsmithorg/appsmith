package com.appsmith.server.migrations.ce;

import com.appsmith.external.helpers.JsonForDatabase;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Set;

public class V007__createAnonymousUser extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;
    private RepositoryHelperMethods helperMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        addAnonymousUser();
    }

    private void addAnonymousUser() throws JsonProcessingException {
        String defaultTenantId = helperMethods.getDefaultTenantId();
        if (doesAnonymousUserExist(defaultTenantId)) {
            return;
        }
        String insertUserQuery =
                "INSERT INTO \"user\" (id, email, name,  current_workspace_id, workspace_ids, is_anonymous, tenant_id, source, is_system_generated, created_at, updated_at) VALUES (gen_random_uuid(), ?, ?, ?, cast(? as jsonb), ?, ?, ?, true, now() ,now())";
        jdbcTemplate.update(
                insertUserQuery,
                FieldName.ANONYMOUS_USER,
                FieldName.ANONYMOUS_USER,
                "",
                JsonForDatabase.writeValueAsString(Set.of()),
                true,
                defaultTenantId,
                LoginSource.FORM.toString());
    }

    private boolean doesAnonymousUserExist(String tenantId) {
        String sql = "SELECT COUNT(*) FROM \"user\" WHERE email = ? and tenant_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, FieldName.ANONYMOUS_USER, tenantId);
        return count != null && count != 0;
    }
}
