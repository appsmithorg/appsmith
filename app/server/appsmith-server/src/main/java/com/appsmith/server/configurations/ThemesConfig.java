package com.appsmith.server.configurations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.ThemeRepositoryCake;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;

@Configuration
@Slf4j
@RequiredArgsConstructor
public class ThemesConfig {
    private final ConfigRepositoryCake configRepository;
    private final PermissionGroupRepositoryCake permissionGroupRepository;
    private final ThemeRepositoryCake themeRepository;

    @Bean
    public Mono<Boolean> createSystemTheme() throws IOException {
        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset());
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        List<Theme> themes =
                Arrays.stream(mapper.readValue(themesJson, Theme[].class)).toList();

        Mono<String> permissionGroupIdMono = configRepository
                .findByName(PUBLIC_PERMISSION_GROUP)
                .switchIfEmpty(
                        Mono.error(new IllegalStateException("Public permission group not found in the database.")))
                .map(config -> config.getConfig().getAsString(PERMISSION_GROUP_ID));

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupIdMono
                .flatMap(permissionGroupId -> permissionGroupRepository.findById(permissionGroupId))
                .switchIfEmpty(
                        Mono.error(new IllegalStateException("Public permission group not found in the database.")));

        return publicPermissionGroupMono.flatMap(publicPermissionGroup -> {
            // Initialize the permissions for the role
            HashSet<Permission> permissions = new HashSet<>();
            if (publicPermissionGroup.getPermissions() != null) {
                permissions.addAll(publicPermissionGroup.getPermissions());
            }

            Policy policyWithCurrentPermission = Policy.builder()
                    .permission(READ_THEMES.getValue())
                    .permissionGroups(Set.of(publicPermissionGroup.getId()))
                    .build();

            return Flux.fromIterable(themes)
                    .flatMap(theme -> {
                        theme.setSystemTheme(true);
                        theme.setCreatedAt(Instant.now());
                        theme.setPolicies(new HashSet<>(Set.of(policyWithCurrentPermission)));

                        Mono<Theme> savedThemeMono = themeRepository.getSystemThemeByName(theme.getName());
                        return savedThemeMono
                                .switchIfEmpty(themeRepository.save(theme)) // this theme does not exist, create it
                                .flatMap(savedTheme -> {
                                    // theme already found, update
                                    savedTheme.setDisplayName(theme.getDisplayName());
                                    savedTheme.setPolicies(theme.getPolicies());
                                    savedTheme.setConfig(theme.getConfig());
                                    savedTheme.setProperties(theme.getProperties());
                                    savedTheme.setStylesheet(theme.getStylesheet());
                                    if (savedTheme.getCreatedAt() == null) {
                                        savedTheme.setCreatedAt(Instant.now());
                                    }
                                    return themeRepository.save(savedTheme);
                                })
                                .flatMap(savedTheme -> {
                                    // Add the access to this theme to the public permission group
                                    boolean isThemePermissionPresent = permissions.stream()
                                            .anyMatch(p -> p.getAclPermission().equals(READ_THEMES)
                                                    && p.getDocumentId().equals(savedTheme.getId()));
                                    if (!isThemePermissionPresent) {
                                        permissions.add(new Permission(savedTheme.getId(), READ_THEMES));
                                    }
                                    return Mono.just(savedTheme);
                                })
                                .thenReturn(permissions)
                                .flatMap(permissionHashSet -> {
                                    // Finally save the role which gives access to all the system themes to the
                                    // anonymous user.
                                    publicPermissionGroup.setPermissions(permissionHashSet);
                                    return permissionGroupRepository.save(publicPermissionGroup);
                                });
                    })
                    .then(Mono.just(true));
        });
    }
}
