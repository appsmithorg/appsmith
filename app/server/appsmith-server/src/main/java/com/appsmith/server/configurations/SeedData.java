package com.appsmith.server.configurations;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.Modifying;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_ENV;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Configuration
@Slf4j
public class SeedData {
    // TODO: Move to separate files in a "seeds" package? Or to migrations?

    @Bean
    public String instanceId(ConfigRepository configRepository) {
        final Object value = configRepository
                .findByName("instance-id")
                .orElseGet(() -> {
                    log.debug("Adding instance id");
                    final String valueStr = UUID.randomUUID().toString();
                    return configRepository.save(new Config(new JSONObject(Map.of("value", valueStr)), "instance-id"));
                })
                .getConfig()
                .get("value");

        if (value instanceof String valueStr) {
            return valueStr;
        } else {
            throw new IllegalStateException("instance-id config value is not a string");
        }
    }

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
                            user.get(fieldName(QUser.user.policies)),
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

    @Bean
    public Tenant defaultTenant(TenantRepository tenantRepository) {
        return tenantRepository.findBySlug("default").orElseGet(() -> {
            Tenant defaultTenant = new Tenant();
            defaultTenant.setDisplayName("Default");
            defaultTenant.setSlug("default");
            defaultTenant.setPricingPlan(PricingPlan.FREE);
            return tenantRepository.save(defaultTenant);
        });
    }

    @Bean
    public User anonymousUser(UserRepository userRepository, Tenant defaultTenant) {
        log.debug("Adding anonymous user");
        return userRepository.findByEmail(FieldName.ANONYMOUS_USER).orElseGet(() -> {
            final User anonymousUser = new User();
            anonymousUser.setName(FieldName.ANONYMOUS_USER);
            anonymousUser.setEmail(FieldName.ANONYMOUS_USER);
            anonymousUser.setCurrentWorkspaceId("");
            anonymousUser.setWorkspaceIds(new HashSet<>());
            anonymousUser.setIsAnonymous(true);
            anonymousUser.setTenantId(defaultTenant.getId());
            return userRepository.save(anonymousUser);
        });
    }

    @Bean
    public Config anonymousUserPermissionGroup(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            User anonymousUser) {
        return configRepository.findByName(FieldName.PUBLIC_PERMISSION_GROUP).orElseGet(() -> {
            log.debug("Adding anonymous user permission group");

            PermissionGroup publicPermissionGroup = new PermissionGroup();
            publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
            publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");
            publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
            permissionGroupRepository.save(publicPermissionGroup);

            return configRepository.save(new Config(
                    new JSONObject(Map.of(FieldName.PERMISSION_GROUP_ID, publicPermissionGroup.getId())),
                    FieldName.PUBLIC_PERMISSION_GROUP));
        });
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
        .executeUpdate();*/
        return true;
    }
}
