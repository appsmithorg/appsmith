package com.appsmith.server.configurations;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
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
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_ENV;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;

@Configuration
@Slf4j
public class SeedData {
    // TODO: Move to separate files in a "seeds" package? Or to migrations?

    @Bean
    public String instanceAdminPermissionGroupId(
            EntityManager entityManager,
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        final Object value = configRepository
                .findByName(FieldName.INSTANCE_CONFIG)
                .orElseGet(() -> {
                    final Config instanceConfig = configRepository.save(new Config(null, FieldName.INSTANCE_CONFIG));

                    final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                    final CriteriaQuery<User> cq = cb.createQuery(User.class);
                    final Root<User> user = cq.from(User.class);
                    cq.where(cb.function(
                            "jsonb_path_exists",
                            Boolean.class,
                            user.get(User.Fields.policies),
                            cb.literal("$[*] ? (@.permission == \"" + MANAGE_INSTANCE_ENV + "\")")));
                    final List<User> adminUsers = entityManager.createQuery(cq).getResultList();

                    final PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
                    instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
                    instanceManagerPermissionGroup.setPermissions(
                            Set.of(new Permission(instanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)));
                    instanceManagerPermissionGroup.setAssignedToUserIds(
                            adminUsers.stream().map(User::getId).collect(Collectors.toSet()));
                    permissionGroupRepository.save(instanceManagerPermissionGroup);

                    instanceConfig.setConfig(
                            new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, instanceManagerPermissionGroup.getId())));

                    Policy editConfigPolicy = Policy.builder()
                            .permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                            .permissionGroups(Set.of(instanceManagerPermissionGroup.getId()))
                            .build();
                    Policy readConfigPolicy = Policy.builder()
                            .permission(READ_INSTANCE_CONFIGURATION.getValue())
                            .permissionGroups(Set.of(instanceManagerPermissionGroup.getId()))
                            .build();

                    instanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)));

                    configRepository.save(instanceConfig);

                    // Also give the permission group permission to unassign & assign & read to itself
                    Policy updatePermissionGroupPolicy = Policy.builder()
                            .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(instanceManagerPermissionGroup.getId()))
                            .build();

                    Policy assignPermissionGroupPolicy = Policy.builder()
                            .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(instanceManagerPermissionGroup.getId()))
                            .build();

                    instanceManagerPermissionGroup.setPolicies(
                            new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)));

                    Set<Permission> permissions = new HashSet<>(instanceManagerPermissionGroup.getPermissions());
                    permissions.addAll(Set.of(
                            new Permission(
                                    instanceManagerPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS),
                            new Permission(instanceManagerPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                            new Permission(instanceManagerPermissionGroup.getId(), READ_PERMISSION_GROUP_MEMBERS)));
                    instanceManagerPermissionGroup.setPermissions(permissions);

                    permissionGroupRepository.save(instanceManagerPermissionGroup);

                    return instanceConfig;
                })
                .getConfig()
                .get(DEFAULT_PERMISSION_GROUP);

        if (value instanceof String valueStr) {
            inMemoryCacheableRepositoryHelper.setInstanceAdminPermissionGroupId(valueStr);
            return valueStr;
        } else {
            throw new IllegalStateException("instance-id config value is not a string");
        }
    }

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
                .orElseGet(() -> {
                    log.debug("Adding anonymous user permission group");
                    // Find anonymous user
                    final User anonymousUser =
                            userRepository.findByEmail(FieldName.ANONYMOUS_USER).orElseThrow();

                    final PermissionGroup publicPermissionGroup = new PermissionGroup();
                    publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
                    publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");
                    assert anonymousUser.getId() != null : "Anonymous user id is null";
                    publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
                    permissionGroupRepository.save(publicPermissionGroup);

                    final Config config = configRepository.save(new Config(
                            new JSONObject(Map.of(FieldName.PERMISSION_GROUP_ID, publicPermissionGroup.getId())),
                            FieldName.PUBLIC_PERMISSION_GROUP));

                    return new PublicPermissionInfo(publicPermissionGroup, config);
                });
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
