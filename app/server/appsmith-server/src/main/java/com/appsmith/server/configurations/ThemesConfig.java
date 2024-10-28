package com.appsmith.server.configurations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;

@Configuration
@Slf4j
@RequiredArgsConstructor
public class ThemesConfig implements ApplicationListener<ApplicationReadyEvent> {
    private final ConfigRepository configRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ThemeRepository themeRepository;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        final String themesJson;
        try {
            themesJson = StreamUtils.copyToString(
                    new DefaultResourceLoader()
                            .getResource("system-themes.json")
                            .getInputStream(),
                    Charset.defaultCharset());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        Theme[] themes = new Theme[0];
        try {
            themes = mapper.readValue(themesJson, Theme[].class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        Config publicPermissionGroupConfig =
                configRepository.findByName(PUBLIC_PERMISSION_GROUP).orElse(null);
        if (publicPermissionGroupConfig == null) {
            throw new IllegalStateException("Public permission group not found in the database.");
        }

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        PermissionGroup publicPermissionGroup =
                permissionGroupRepository.findById(permissionGroupId).orElse(null);

        if (publicPermissionGroup == null) {
            throw new IllegalStateException("Public permission group not found in the database.");
        }
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

            themeRepository.getSystemThemeByName(theme.getName());
            Theme savedTheme =
                    themeRepository.getSystemThemeByName(theme.getName()).orElse(null);

            if (savedTheme == null) { // this theme does not exist, create it
                savedTheme = themeRepository.save(theme);
            } else { // theme already found, update
                savedTheme.setDisplayName(theme.getDisplayName());
                savedTheme.setPolicies(theme.getPolicies());
                savedTheme.setConfig(theme.getConfig());
                savedTheme.setProperties(theme.getProperties());
                savedTheme.setStylesheet(theme.getStylesheet());
                if (savedTheme.getCreatedAt() == null) {
                    savedTheme.setCreatedAt(Instant.now());
                }
                savedTheme = themeRepository.save(savedTheme);
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
        permissionGroupRepository.save(publicPermissionGroup);
    }
}
