package com.appsmith.server.migrations.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;

public class V011__createSystemThemes extends AppsmithJavaMigration {
    private RepositoryHelperMethods repositoryHelperMethods;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        repositoryHelperMethods = new RepositoryHelperMethods(jdbcTemplate);
        createSystemTheme();
    }

    private void createSystemTheme() throws IOException {
        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset());
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        Theme[] themes = mapper.readValue(themesJson, Theme[].class);

        Config publicPermissionGroupConfig = repositoryHelperMethods.getConfig(PUBLIC_PERMISSION_GROUP);
        if (publicPermissionGroupConfig == null) {
            throw new IllegalStateException("Public permission group not found in the database.");
        }

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        PermissionGroup publicPermissionGroup = repositoryHelperMethods.getPermissionGroup(permissionGroupId);

        // Initialize the permissions for the role
        HashSet<Permission> permissions = new HashSet<>();
        if (publicPermissionGroup.getPermissions() != null) {
            permissions.addAll(publicPermissionGroup.getPermissions());
        }

        Policy policyWithCurrentPermission = Policy.builder()
                .permission(READ_THEMES.getValue())
                .permissionGroups(Set.of(publicPermissionGroup.getId()))
                .build();

        for (Theme theme : themes) {
            theme.setSystemTheme(true);
            theme.setCreatedAt(Instant.now());
            theme.setPolicies(new HashSet<>(Set.of(policyWithCurrentPermission)));

            Theme savedTheme = repositoryHelperMethods.getTheme(theme.getName(), true);
            if (savedTheme == null) { // this theme does not exist, create it
                savedTheme = repositoryHelperMethods.createTheme(theme);
            } else { // theme already found, update
                savedTheme.setDisplayName(theme.getDisplayName());
                savedTheme.setPolicies(theme.getPolicies());
                savedTheme.setConfig(theme.getConfig());
                savedTheme.setProperties(theme.getProperties());
                savedTheme.setStylesheet(theme.getStylesheet());
                if (savedTheme.getCreatedAt() == null) {
                    savedTheme.setCreatedAt(Instant.now());
                }
                repositoryHelperMethods.saveTheme(savedTheme);
            }

            // Add the access to this theme to the public permission group
            Theme finalSavedTheme = savedTheme;
            boolean isThemePermissionPresent = permissions.stream()
                    .filter(p -> p.getAclPermission().equals(READ_THEMES)
                            && p.getDocumentId().equals(finalSavedTheme.getId()))
                    .findFirst()
                    .isPresent();
            if (!isThemePermissionPresent) {
                permissions.add(new Permission(finalSavedTheme.getId(), READ_THEMES));
            }
        }

        // Finally save the role which gives access to all the system themes to the anonymous user.
        publicPermissionGroup.setPermissions(permissions);
        repositoryHelperMethods.savePermissionGroup(publicPermissionGroup);
    }
}
