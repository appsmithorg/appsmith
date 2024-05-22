package com.appsmith.server.configurations;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.Modifying;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@Configuration
@Slf4j
public class SeedData {
    public record PublicPermissionInfo(PermissionGroup permissionGroup, Config config) {}

    @Bean
    public PublicPermissionInfo publicPermissionInfo(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            UserRepository userRepository) {
        return configRepository
                .findByName(FieldName.PUBLIC_PERMISSION_GROUP)
                .map(config -> {
                    final PermissionGroup permissionGroup = permissionGroupRepository
                            .findById(config.getConfig().getAsString(FieldName.PERMISSION_GROUP_ID))
                            .orElseThrow() /* this is when config exists, but permission group doesn't */;
                    return new PublicPermissionInfo(permissionGroup, config);
                })
                .orElse(null);
    }

    @Bean
    public List<Theme> systemThemes(
            EntityManager entityManager,
            ThemeRepository themeRepository,
            ObjectMapper objectMapper,
            PublicPermissionInfo publicPermissionInfo,
            PermissionGroupRepository permissionGroupRepository)
            throws IOException {
        final Theme[] themes =
                objectMapper.readValue(new ClassPathResource("system-themes.json").getFile(), Theme[].class);
        final List<Theme> systemThemes = new ArrayList<>();

        final PermissionGroup publicPermissionGroup = publicPermissionInfo.permissionGroup();

        Policy policyWithCurrentPermission = Policy.builder()
                .permission(READ_THEMES.getValue())
                .permissionGroups(Set.of(publicPermissionGroup.getId()))
                .build();

        final Set<Permission> publicPermissions = new HashSet<>();
        if (publicPermissionGroup.getPermissions() != null) {
            publicPermissions.addAll(publicPermissionGroup.getPermissions());
        }

        for (Theme theme : themes) {
            theme.setSystemTheme(true);
            theme.setCreatedAt(Instant.now());
            theme.setPolicies(new HashSet<>(Set.of(policyWithCurrentPermission)));

            CriteriaBuilder cb = entityManager.getCriteriaBuilder();
            CriteriaQuery<Theme> cq = cb.createQuery(Theme.class);
            Root<Theme> root = cq.from(Theme.class);
            cq.where(cb.equal(root.get(Theme.Fields.name), theme.getName()));

            Theme savedTheme;
            try {
                savedTheme = entityManager.createQuery(cq).getSingleResult();
                AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(theme, savedTheme);
                themeRepository.save(savedTheme);
            } catch (NoResultException e) {
                savedTheme = themeRepository.save(theme);
            }

            // Add the access to this theme to the public permission group
            // TODO: Is this needed? Do all tests pass even without this? Permissions field is deprecated..
            Theme finalSavedTheme = savedTheme;
            boolean isThemePermissionPresent = publicPermissions.stream()
                    .anyMatch(p -> p.getAclPermission().equals(READ_THEMES)
                            && p.getDocumentId().equals(finalSavedTheme.getId()));
            if (!isThemePermissionPresent) {
                publicPermissions.add(new Permission(finalSavedTheme.getId(), READ_THEMES));
            }

            systemThemes.add(savedTheme);
        }

        publicPermissionGroup.setPermissions(publicPermissions);
        permissionGroupRepository.save(publicPermissionGroup);

        return Collections.unmodifiableList(systemThemes);
    }

    @Bean
    @Transactional
    @Modifying
    public boolean opFunctionsReady(EntityManager entityManager) {
        entityManager
                .createNativeQuery("CREATE OR REPLACE FUNCTION jsonb_minus(l jsonb, r text) RETURNS jsonb RETURN l - r")
                .executeUpdate();
        /* https://stackoverflow.com/a/50488457/151048
        entityManager
        .createNativeQuery(
                "CREATE OR REPLACE FUNCTION jsonb_question_pipe(l jsonb, r text[]) RETURNS jsonb RETURN l ?| r")
        .executeUpdate(); //*/

        entityManager
                .createNativeQuery("CREATE UNIQUE INDEX IF NOT EXISTS workspace_app_deleted_git_application_metadata"
                        + " ON application (name, workspace_id, deleted_at, (git_application_metadata->>'remoteUrl'), (git_application_metadata->>'branchName'))"
                        + " NULLS NOT DISTINCT")
                .executeUpdate();

        return true;
    }
}
