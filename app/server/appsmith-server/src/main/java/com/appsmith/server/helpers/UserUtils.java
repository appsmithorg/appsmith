package com.appsmith.server.helpers;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.INSTANCE_CONFIG;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

@Component
public class UserUtils {

    private final ConfigRepository configRepository;

    private final PermissionGroupRepository permissionGroupRepository;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    public UserUtils(ConfigRepository configRepository, PermissionGroupRepository permissionGroupRepository,
                     CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.configRepository = configRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
    }

    public Mono<Boolean> isSuperUser(User user) {
        return configRepository.findByNameAsUser(INSTANCE_CONFIG, user, AclPermission.MANAGE_INSTANCE_CONFIGURATION)
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    public Mono<Boolean> isCurrentUserSuperUser() {
        return configRepository.findByName(INSTANCE_CONFIG, AclPermission.MANAGE_INSTANCE_CONFIGURATION)
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    public Mono<Boolean> makeSuperUser(List<User> users) {
        return configRepository.findByName(INSTANCE_CONFIG)
                .switchIfEmpty(Mono.defer(() -> createInstanceConfigForSuperUser()))
                .flatMap(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                    return permissionGroupRepository.findById(defaultPermissionGroup);
                })
                .flatMap(permissionGroup -> {

                    Set<String> assignedToUserIds = new HashSet<>();

                    if (permissionGroup.getAssignedToUserIds() != null) {
                        assignedToUserIds.addAll(permissionGroup.getAssignedToUserIds());
                    }
                    assignedToUserIds.addAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    Update updateObj = new Update();
                    String path = fieldName(QPermissionGroup.permissionGroup.assignedToUserIds);

                    updateObj.set(path, assignedToUserIds);
                    // Make Super User is called before the first administrator is created.
                    return permissionGroupRepository.updateById(permissionGroup.getId(), updateObj);
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> cacheableRepositoryHelper.evictPermissionGroupsUser(user.getEmail(), user.getTenantId()))
                .then(Mono.just(Boolean.TRUE));
    }

    public Mono<Boolean> removeSuperUser(List<User> users) {
        return configRepository.findByName(INSTANCE_CONFIG)
                .switchIfEmpty(createInstanceConfigForSuperUser())
                .flatMap(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                    return permissionGroupRepository.findById(defaultPermissionGroup);
                })
                .flatMap(permissionGroup -> {
                    if (permissionGroup.getAssignedToUserIds() == null) {
                        permissionGroup.setAssignedToUserIds(new HashSet<>());
                    }
                    permissionGroup.getAssignedToUserIds().removeAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    return permissionGroupRepository.updateById(permissionGroup.getId(), permissionGroup, AclPermission.ASSIGN_PERMISSION_GROUPS);
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> cacheableRepositoryHelper.evictPermissionGroupsUser(user.getEmail(), user.getTenantId()))
                .then(Mono.just(Boolean.TRUE));
    }

    private Mono<Config> createInstanceConfigForSuperUser() {
        Config instanceAdminConfiguration = new Config();
        instanceAdminConfiguration.setName(FieldName.INSTANCE_CONFIG);

        return configRepository.save(instanceAdminConfiguration)
                .flatMap(savedInstanceConfig -> {
                    // Create instance management permission group
                    PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
                    instanceManagerPermissionGroup.setName(FieldName.INSTACE_ADMIN_ROLE);
                    instanceManagerPermissionGroup.setPermissions(
                            Set.of(
                                    new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)
                            )
                    );

                    return permissionGroupRepository.save(instanceManagerPermissionGroup)
                            .flatMap(savedPermissionGroup -> {

                                // Update the instance config with the permission group id
                                savedInstanceConfig.setConfig(
                                        new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroup.getId()))
                                );

                                Policy editConfigPolicy = Policy.builder().permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                                        .permissionGroups(Set.of(savedPermissionGroup.getId()))
                                        .build();
                                Policy readConfigPolicy = Policy.builder().permission(READ_INSTANCE_CONFIGURATION.getValue())
                                        .permissionGroups(Set.of(savedPermissionGroup.getId()))
                                        .build();

                                savedInstanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)));

                                return configRepository.save(savedInstanceConfig).zipWith(Mono.just(savedPermissionGroup));
                            });
                })
                .flatMap(tuple -> {
                    Config finalInstanceConfig = tuple.getT1();
                    PermissionGroup savedPermissionGroup = tuple.getT2();

                    Set<Permission> permissions = new HashSet<>(savedPermissionGroup.getPermissions());
                    permissions.addAll(
                            Set.of(
                                    new Permission(savedPermissionGroup.getId(), MANAGE_PERMISSION_GROUPS),
                                    new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS)
                            )
                    );
                    savedPermissionGroup.setPermissions(permissions);

                    // Also give the permission group permission to update & assign to itself
                    Policy updatePermissionGroupPolicy = Policy.builder().permission(MANAGE_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(savedPermissionGroup.getId()))
                            .build();

                    Policy assignPermissionGroupPolicy = Policy.builder().permission(ASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(savedPermissionGroup.getId()))
                            .build();

                    savedPermissionGroup.setPolicies(new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)));

                    return permissionGroupRepository.save(savedPermissionGroup).thenReturn(finalInstanceConfig);
                });
    }

}
