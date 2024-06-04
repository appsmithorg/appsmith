package com.appsmith.server.migrations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RequiredArgsConstructor
public class RepositoryHelperMethods {
    private final JdbcTemplate jdbcTemplate;
    private static final ObjectMapper mapper = new ObjectMapper();

    public String getDefaultTenantId() {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM tenant WHERE slug = 'default' LIMIT 1", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Tenant getDefaultTenant() {
        String sql = "SELECT * FROM tenant WHERE slug = 'default' LIMIT 1";
        RowMapper<Tenant> rowMapper = (rs, rowNum) -> {
            Tenant tenant = new Tenant();
            tenant.setId(rs.getString("id"));
            tenant.setSlug(rs.getString("slug"));

            // Convert JSON string to Set<Policy>
            String policiesJson = rs.getString("policies");
            Set<Policy> policies = mapObject(policiesJson, new TypeReference<Set<Policy>>() {});
            tenant.setPolicies(policies == null ? new HashSet<>() : policies);

            String tenantConfig = rs.getString("tenant_configuration");
            TenantConfiguration tenantConfiguration = mapObject(tenantConfig, new TypeReference<>() {});
            tenant.setTenantConfiguration(
                    tenantConfiguration == null ? new TenantConfiguration() : tenantConfiguration);
            return tenant;
        };
        try {
            return jdbcTemplate.queryForObject(sql, rowMapper);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private <T> T mapObject(String jsonbString, TypeReference<T> typeReference) {
        if (jsonbString == null) {
            return null;
        }
        try {
            return mapper.readValue(jsonbString, typeReference);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public Config getConfig(String name) {
        String sql = "SELECT * FROM config WHERE name = ? LIMIT 1";
        RowMapper<Config> rowMapper = (rs, rowNum) -> {
            Config config = new Config();
            config.setId(rs.getString("id"));
            config.setName(rs.getString("name"));
            String configJson = rs.getString("config");
            String policiesJson = rs.getString("policies");

            Set<Policy> policies = mapObject(policiesJson, new TypeReference<Set<Policy>>() {});
            JSONObject configJsonObj = mapObject(configJson, new TypeReference<JSONObject>() {});
            config.setPolicies(policies == null ? new HashSet<>() : policies);
            config.setConfig(configJsonObj == null ? new JSONObject() : configJsonObj);
            return config;
        };
        try {
            return jdbcTemplate.queryForObject(sql, rowMapper, name);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT * FROM \"user\" WHERE email = ?";
        RowMapper<User> rowMapper = (rs, rowNum) -> {
            User user = new User();
            user.setId(rs.getString("id"));
            user.setEmail(rs.getString("email"));
            user.setName(rs.getString("name"));
            user.setIsAnonymous(rs.getBoolean("is_anonymous"));
            user.setTenantId(rs.getString("tenant_id"));
            return user;
        };
        List<User> users = jdbcTemplate.query(sql, rowMapper, email);
        if (users.isEmpty()) {
            return null;
        }
        return users.get(0);
    }

    public PermissionGroup getPermissionGroup(String id) {
        String sql = "SELECT * FROM permission_group WHERE id = ? LIMIT 1";
        RowMapper<PermissionGroup> rowMapper = (rs, rowNum) -> {
            PermissionGroup permissionGroup = new PermissionGroup();
            permissionGroup.setId(rs.getString("id"));
            permissionGroup.setName(rs.getString("name"));
            String permissionsJson = rs.getString("policies");
            String assignedToUserIdsJson = rs.getString("assigned_to_user_ids");
            Set<Policy> policies = mapObject(permissionsJson, new TypeReference<Set<Policy>>() {});
            Set<String> assignedToUserIds = mapObject(assignedToUserIdsJson, new TypeReference<Set<String>>() {});
            permissionGroup.setPolicies(policies == null ? new HashSet<>() : policies);
            permissionGroup.setAssignedToUserIds(assignedToUserIds == null ? new HashSet<>() : assignedToUserIds);
            return permissionGroup;
        };
        try {
            return jdbcTemplate.queryForObject(sql, rowMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    /**
     * Maps a tuple to an object of the given type using the constructor of the type. The order of the tuple should be
     * the same as the order of the fields in the type constructor.
     *
     * @param type  The type of the object to be created
     * @param tuple The tuple to be mapped to the object
     * @param <T>   The type of the object to be created
     * @return The object of the given type
     */
    public static <T> T map(Object[] tuple, Class<T> type) {
        List<Class<?>> tupleTypes = new ArrayList<>();
        for (Field field : type.getDeclaredFields()) {
            tupleTypes.add(field.getType());
        }
        try {
            Constructor<T> constructor = type.getConstructor(tupleTypes.toArray(new Class<?>[tuple.length]));
            return constructor.newInstance(tuple);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public PermissionGroup createPermissionGroup(PermissionGroup permissionGroup) throws JsonProcessingException {
        String uuid = UUID.randomUUID().toString();
        String insertInstanceConfigurationQuery =
                "INSERT INTO permission_group (id, name, permissions, assigned_to_user_ids, created_at, updated_at) VALUES (?, ?, cast(? as jsonb), ?::jsonb, now(), now())";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                uuid,
                permissionGroup.getName(),
                JsonHelper.convertToString(permissionGroup.getPermissions()),
                JsonHelper.convertToString(permissionGroup.getAssignedToUserIds()));
        permissionGroup.setId(uuid);
        return permissionGroup;
    }

    public PermissionGroup savePermissionGroup(PermissionGroup permissionGroup) throws JsonProcessingException {
        String id = permissionGroup.getId();
        String insertInstanceConfigurationQuery =
                "UPDATE permission_group SET name = ?,  policies = cast(? as jsonb), permissions = cast(? as jsonb), updated_at = now() WHERE id = ?";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                permissionGroup.getName(),
                JsonHelper.convertToString(permissionGroup.getPolicies()),
                JsonHelper.convertToString(permissionGroup.getPermissions()),
                id);
        return permissionGroup;
    }

    public Config createConfig(Config config) throws JsonProcessingException {
        String id = UUID.randomUUID().toString();
        String insertInstanceConfigurationQuery =
                "INSERT INTO config (id, name,  config, policies, created_at, updated_at) VALUES (?, ?, cast(? as jsonb), cast(? as jsonb), now(), now())";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                id,
                config.getName(),
                JsonHelper.convertToString(config.getConfig()),
                JsonHelper.convertToString(config.getPolicies()));
        config.setId(id);
        return config;
    }

    public Config saveConfig(Config config) throws JsonProcessingException {
        String id = config.getId();
        String insertInstanceConfigurationQuery =
                "UPDATE config SET name = ?,  config = cast(? as jsonb), policies = cast(? as jsonb), updated_at = now() WHERE id = ?";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                config.getName(),
                JsonHelper.convertToString(config.getConfig()),
                JsonHelper.convertToString(config.getPolicies()),
                id);
        return config;
    }

    public Tenant saveTenant(Tenant tenant) throws JsonProcessingException {
        String id = tenant.getId();
        String insertInstanceConfigurationQuery =
                "UPDATE tenant SET slug = ?, tenant_configuration = cast(? as jsonb), policies = cast(? as jsonb), updated_at = now() WHERE id = ?";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                tenant.getSlug(),
                JsonHelper.convertToString(tenant.getTenantConfiguration()),
                JsonHelper.convertToString(tenant.getPolicies()),
                id);
        return tenant;
    }

    public Theme getTheme(String name, boolean isSystemTheme) {
        String sqlQuery = "SELECT * FROM theme WHERE name = ? AND is_system_theme = ?";
        RowMapper<Theme> rowMapper = (rs, rowNum) -> {
            Theme theme = new Theme();
            theme.setId(rs.getString("id"));
            theme.setName(rs.getString("name"));
            theme.setDisplayName(rs.getString("display_name"));
            theme.setStylesheet(mapObject(rs.getString("stylesheet"), new TypeReference<Map<String, Object>>() {}));
            theme.setProperties(mapObject(rs.getString("properties"), new TypeReference<Map<String, Object>>() {}));
            theme.setConfig(mapObject(rs.getString("config"), new TypeReference<Map<String, Object>>() {}));
            theme.setSystemTheme(rs.getBoolean("is_system_theme"));
            return theme;
        };
        try {
            return jdbcTemplate.queryForObject(sqlQuery, rowMapper, name, isSystemTheme);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public Theme saveTheme(Theme theme) throws JsonProcessingException {
        String id = theme.getId();
        String updateThemeQuery =
                "UPDATE theme SET name = ?, display_name = ?, config = cast(? as jsonb), properties = cast(? as jsonb), stylesheet = cast(? as jsonb), policies = cast(? as jsonb), updated_at = now() WHERE id = ?";
        jdbcTemplate.update(
                updateThemeQuery,
                theme.getName(),
                theme.getDisplayName(),
                JsonHelper.convertToString(theme.getConfig()),
                JsonHelper.convertToString(theme.getProperties()),
                JsonHelper.convertToString(theme.getStylesheet()),
                JsonHelper.convertToString(theme.getPolicies()),
                id);
        return theme;
    }

    public Theme createTheme(Theme theme) throws JsonProcessingException {
        String id = UUID.randomUUID().toString();
        String insertInstanceConfigurationQuery =
                "INSERT INTO theme (id, name, display_name, config, properties, stylesheet, is_system_theme, policies, created_at, updated_at) VALUES (?, ?, ?, cast(? as jsonb), cast(? as jsonb), cast(? as jsonb), ?, cast(? as jsonb), now(), now())";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                id,
                theme.getName(),
                theme.getDisplayName(),
                JsonHelper.convertToString(theme.getConfig()),
                JsonHelper.convertToString(theme.getProperties()),
                JsonHelper.convertToString(theme.getStylesheet()),
                theme.isSystemTheme(),
                JsonHelper.convertToString(theme.getPolicies()));
        theme.setId(id);
        return theme;
    }
}
