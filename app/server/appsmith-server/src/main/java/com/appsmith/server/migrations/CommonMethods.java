package com.appsmith.server.migrations;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.Permission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import net.minidev.json.JSONObject;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class CommonMethods {
    private final JdbcTemplate jdbcTemplate;
    private ObjectMapper mapper = new ObjectMapper();
    private PolicyGenerator policyGenerator = new PolicyGenerator();

    public String getDefaultTenantId() {
        return jdbcTemplate.queryForObject("SELECT id FROM tenant WHERE slug = 'default' LIMIT 1", String.class);
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
            return tenant;
        };
        return jdbcTemplate.queryForObject(sql, rowMapper);
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
        String sql = "SELECT * FROM config WHERE name = ?";
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
        return jdbcTemplate.queryForObject(sql, rowMapper, name);
    }

    public PermissionGroup getPermissionGroup(String id) {
        String sql = "SELECT * FROM permission_group WHERE id = ?";
        RowMapper<PermissionGroup> rowMapper = (rs, rowNum) -> {
            PermissionGroup permissionGroup = new PermissionGroup();
            permissionGroup.setId(rs.getString("id"));
            permissionGroup.setName(rs.getString("name"));
            String permissionsJson = rs.getString("policies");
            Set<Policy> policies = mapObject(permissionsJson, new TypeReference<Set<Policy>>() {});
            permissionGroup.setPolicies(policies == null ? new HashSet<>() : policies);
            return permissionGroup;
        };
        return jdbcTemplate.queryForObject(sql, rowMapper, id);
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
                "INSERT INTO permission_group (id, name,  permissions, created_at, updated_at) VALUES (?, ?, cast(? as jsonb), now(), now())";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                uuid,
                permissionGroup.getName(),
                JsonHelper.convertToString(permissionGroup.getPermissions()));
        permissionGroup.setId(uuid);
        return permissionGroup;
    }

    public PermissionGroup savePermissionGroup(PermissionGroup permissionGroup) throws JsonProcessingException {
        String id = permissionGroup.getId();
        String insertInstanceConfigurationQuery =
                "UPDATE permission_group SET name = ?,  policies = cast(? as jsonb), updated_at = now() WHERE id = ?";
        jdbcTemplate.update(
                insertInstanceConfigurationQuery,
                permissionGroup.getName(),
                JsonHelper.convertToString(permissionGroup.getPolicies()),
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

    public <T extends BaseDomain> T addPoliciesToExistingObject(Map<String, Policy> policyMap, T obj) {
        // Making a deep copy here so we don't modify the `policyMap` object.
        // TODO: Investigate a solution without using deep-copy.
        // TODO: Do we need to return the domain object?
        final Map<String, Policy> policyMap1 = new HashMap<>();
        for (Map.Entry<String, Policy> entry : policyMap.entrySet()) {
            Policy entryValue = entry.getValue();
            Policy policy = Policy.builder()
                    .permission(entryValue.getPermission())
                    .permissionGroups(new HashSet<>(entryValue.getPermissionGroups()))
                    .build();
            policyMap1.put(entry.getKey(), policy);
        }

        // Append the user to the existing permission policy if it already exists.
        for (Policy policy : obj.getPolicies()) {
            String permission = policy.getPermission();
            if (policyMap1.containsKey(permission)) {
                Set<String> permissionGroups = new HashSet<>();
                if (policy.getPermissionGroups() != null) {
                    permissionGroups.addAll(policy.getPermissionGroups());
                }
                if (policyMap1.get(permission).getPermissionGroups() != null) {
                    permissionGroups.addAll(policyMap1.get(permission).getPermissionGroups());
                }
                policy.setPermissionGroups(permissionGroups);
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap1.remove(permission);
            }
        }

        obj.getPolicies().addAll(policyMap1.values());
        return obj;
    }

    public Map<String, Policy> generatePolicyFromPermissionGroupForObject(
            PermissionGroup permissionGroup, String objectId) {
        Set<Permission> permissions = permissionGroup.getPermissions();
        return permissions.stream()
                .filter(perm -> perm.getDocumentId().equals(objectId))
                .map(perm -> {
                    Policy policyWithCurrentPermission = Policy.builder()
                            .permission(perm.getAclPermission().getValue())
                            .permissionGroups(Set.of(permissionGroup.getId()))
                            .build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForPermissionGroup = policyGenerator.getLateralPolicies(
                            perm.getAclPermission(), Set.of(permissionGroup.getId()), null);
                    policiesForPermissionGroup.add(policyWithCurrentPermission);
                    return policiesForPermissionGroup;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toMap(Policy::getPermission, Function.identity(), (policy1, policy2) -> policy1));
    }
}
