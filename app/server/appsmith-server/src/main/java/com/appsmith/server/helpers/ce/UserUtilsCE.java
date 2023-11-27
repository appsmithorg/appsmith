package com.appsmith.server.helpers.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.solutions.PermissionGroupPermission;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.INSTANCE_CONFIG;

public class UserUtilsCE {

    private final ConfigRepository configRepository;

    private final PermissionGroupRepository permissionGroupRepository;

    private final PermissionGroupPermission permissionGroupPermission;

    public UserUtilsCE(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PermissionGroupPermission permissionGroupPermission) {
        this.configRepository = configRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.permissionGroupPermission = permissionGroupPermission;
    }

    public Mono<Boolean> isSuperUser(User user) {
        return Mono.justOrEmpty(configRepository.findByNameAsUser(
                        INSTANCE_CONFIG, user, AclPermission.MANAGE_INSTANCE_CONFIGURATION))
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    public Mono<Boolean> isCurrentUserSuperUser() {
        return Mono.justOrEmpty(
                        configRepository.findByName(INSTANCE_CONFIG, AclPermission.MANAGE_INSTANCE_CONFIGURATION))
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    public Mono<Boolean> makeSuperUser(List<User> users) {
        return Mono.empty(); /*
        return getSuperAdminPermissionGroup()
                .flatMap(permissionGroup -> {
                    Set<String> assignedToUserIds = new HashSet<>();

                    if (permissionGroup.getAssignedToUserIds() != null) {
                        assignedToUserIds.addAll(permissionGroup.getAssignedToUserIds());
                    }
                    assignedToUserIds.addAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    Update updateObj = new Update();
                    String path = "assignedToUserIds";

                    updateObj.set(path, assignedToUserIds);
                    // Make Super User is called before the first administrator is created.
                    return permissionGroupRepository.updateById(permissionGroup.getId(), updateObj);
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> permissionGroupRepository.evictAllPermissionGroupCachesForUser(
                        user.getEmail(), user.getTenantId()))
                .then(Mono.just(Boolean.TRUE));//*/
    }

    public Mono<Boolean> removeSuperUser(List<User> users) {
        return Mono.empty(); /*
        return getSuperAdminPermissionGroup()
                .flatMap(permissionGroup -> {
                    if (permissionGroup.getAssignedToUserIds() == null) {
                        permissionGroup.setAssignedToUserIds(new HashSet<>());
                    }
                    permissionGroup
                            .getAssignedToUserIds()
                            .removeAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    return permissionGroupRepository.updateById(
                            permissionGroup.getId(), permissionGroup, permissionGroupPermission.getAssignPermission());
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> permissionGroupRepository.evictAllPermissionGroupCachesForUser(
                        user.getEmail(), user.getTenantId()))
                .then(Mono.just(Boolean.TRUE));//*/
    }

    protected Mono<Config> createInstanceConfigForSuperUser() {

        Mono<Tuple2<PermissionGroup, Config>> savedConfigAndPermissionGroupMono =
                createConfigAndPermissionGroupForSuperAdmin();

        // return the saved instance config
        return savedConfigAndPermissionGroupMono.map(Tuple2::getT2);
    }

    protected Mono<Tuple2<PermissionGroup, Config>> createConfigAndPermissionGroupForSuperAdmin() {
        return Mono.empty(); /*
        return Mono.zip(createInstanceAdminConfigObject(), createInstanceAdminPermissionGroupWithoutPermissions())
                .flatMap(tuple -> {
                    Config savedInstanceConfig = tuple.getT1();
                    PermissionGroup savedPermissionGroup = tuple.getT2();

                    // Update the instance config with the permission group id
                    savedInstanceConfig.setConfig(
                            new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroup.getId())));

                    Policy editConfigPolicy = Policy.builder()
                            .permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                            .permissionGroups(Set.of(savedPermissionGroup.getId()))
                            .build();
                    Policy readConfigPolicy = Policy.builder()
                            .permission(READ_INSTANCE_CONFIGURATION.getValue())
                            .permissionGroups(Set.of(savedPermissionGroup.getId()))
                            .build();

                    savedInstanceConfig.setPolicies(Set.of(editConfigPolicy, readConfigPolicy));

                    // Add config permissions to permission group
                    Set<Permission> configPermissions =
                            Set.of(new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION));

                    return Mono.zip(
                            addPermissionsToPermissionGroup(savedPermissionGroup, configPermissions),
                            configRepository.save(savedInstanceConfig));
                });//*/
    }

    private Mono<Config> createInstanceAdminConfigObject() {
        return Mono.empty(); /*
        Config instanceAdminConfiguration = new Config();
        instanceAdminConfiguration.setName(FieldName.INSTANCE_CONFIG);

        return configRepository.save(instanceAdminConfiguration);//*/
    }

    private Mono<PermissionGroup> createInstanceAdminPermissionGroupWithoutPermissions() {
        return Mono.empty(); /*
        PermissionGroup instanceAdminPermissionGroup = new PermissionGroup();
        instanceAdminPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);

        return permissionGroupRepository.save(instanceAdminPermissionGroup).flatMap(savedPermissionGroup -> {
            Set<Permission> permissions = Set.of(
                    new Permission(savedPermissionGroup.getId(), READ_PERMISSION_GROUP_MEMBERS),
                    new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                    new Permission(savedPermissionGroup.getId(), UNASSIGN_PERMISSION_GROUPS));
            savedPermissionGroup.setPermissions(permissions);

            Policy readPermissionGroupPolicy = Policy.builder()
                    .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                    .permissionGroups(Set.of(savedPermissionGroup.getId()))
                    .build();

            Policy assignPermissionGroupPolicy = Policy.builder()
                    .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                    .permissionGroups(Set.of(savedPermissionGroup.getId()))
                    .build();

            Policy unassignPermissionGroupPolicy = Policy.builder()
                    .permission(UNASSIGN_PERMISSION_GROUPS.getValue())
                    .permissionGroups(Set.of(savedPermissionGroup.getId()))
                    .build();

            savedPermissionGroup.setPolicies(
                    Set.of(readPermissionGroupPolicy, assignPermissionGroupPolicy, unassignPermissionGroupPolicy));

            return permissionGroupRepository.save(savedPermissionGroup);
        });*/
    }

    protected Mono<PermissionGroup> addPermissionsToPermissionGroup(
            PermissionGroup permissionGroup, Set<Permission> permissions) {
        return Mono.empty(); /*
        Set<Permission> existingPermissions = new HashSet<>(permissionGroup.getPermissions());
        existingPermissions.addAll(permissions);
        permissionGroup.setPermissions(existingPermissions);
        return permissionGroupRepository.save(permissionGroup);*/
    }

    public Mono<PermissionGroup> getSuperAdminPermissionGroup() {
        return configRepository
                .findByName(INSTANCE_CONFIG)
                .switchIfEmpty(Mono.defer(() -> createInstanceConfigForSuperUser()))
                .flatMap(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
                    return Mono.justOrEmpty(permissionGroupRepository.retrieveById(defaultPermissionGroup));
                });
    }
}
