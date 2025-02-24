package com.appsmith.server.helpers.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import io.micrometer.observation.ObservationRegistry;
import net.minidev.json.JSONObject;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.UserSpan.CHECK_SUPER_USER_SPAN;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.INSTANCE_CONFIG;
import static org.springframework.util.StringUtils.hasLength;

public class UserUtilsCE {

    private final ConfigRepository configRepository;

    private final PermissionGroupRepository permissionGroupRepository;

    private final ObservationRegistry observationRegistry;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final CommonConfig commonConfig;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;

    public UserUtilsCE(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            ObservationRegistry observationRegistry,
            CommonConfig commonConfig,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        this.configRepository = configRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.observationRegistry = observationRegistry;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.commonConfig = commonConfig;
        this.inMemoryCacheableRepositoryHelper = inMemoryCacheableRepositoryHelper;
    }

    public Mono<Boolean> isSuperUser(User user) {
        return configRepository
                .findByNameAsUser(INSTANCE_CONFIG, user, AclPermission.MANAGE_INSTANCE_CONFIGURATION)
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE))
                .name(CHECK_SUPER_USER_SPAN)
                .tap(Micrometer.observation(observationRegistry));
    }

    public Mono<Boolean> isCurrentUserSuperUser() {
        return configRepository
                .findByName(INSTANCE_CONFIG, AclPermission.MANAGE_INSTANCE_CONFIGURATION)
                .map(config -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE));
    }

    public Mono<Boolean> makeInstanceAdministrator(List<User> users) {

        // TODO : Replace cloud hosting check with a feature flag check for multi tenancy
        boolean cloudHosting = commonConfig.isCloudHosting();
        Mono<PermissionGroup> organizationAdminPgMono = Mono.just(new PermissionGroup());

        if (!cloudHosting) {
            organizationAdminPgMono = getDefaultOrganizationAdminPermissionGroup();
        }

        return Mono.zip(getInstanceAdminPermissionGroup(), organizationAdminPgMono)
                .flatMap(tuple -> {
                    PermissionGroup instanceAdminPg = tuple.getT1();
                    PermissionGroup organizationAdminPg = tuple.getT2();

                    Set<String> assignedToUserIds = new HashSet<>();

                    if (instanceAdminPg.getAssignedToUserIds() != null) {
                        assignedToUserIds.addAll(instanceAdminPg.getAssignedToUserIds());
                    }
                    assignedToUserIds.addAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    BridgeUpdate updateObj = Bridge.update();
                    String path = PermissionGroup.Fields.assignedToUserIds;

                    updateObj.set(path, assignedToUserIds);
                    // Make Instance Admin is called before the first administrator is created.
                    Mono<Integer> updateInstanceAdminPgAssignmentMono =
                            permissionGroupRepository.updateById(instanceAdminPg.getId(), updateObj);

                    if (!hasLength(organizationAdminPg.getId())) {
                        return updateInstanceAdminPgAssignmentMono;
                    }

                    // Also assign the users to the organization admin permission group
                    Set<String> organizationAdminAssignedToUserIds = new HashSet<>();
                    if (organizationAdminPg.getAssignedToUserIds() != null) {
                        organizationAdminAssignedToUserIds.addAll(organizationAdminPg.getAssignedToUserIds());
                    }
                    organizationAdminAssignedToUserIds.addAll(
                            users.stream().map(User::getId).collect(Collectors.toList()));
                    BridgeUpdate updateObj2 = Bridge.update();
                    String path2 = PermissionGroup.Fields.assignedToUserIds;
                    updateObj2.set(path2, organizationAdminAssignedToUserIds);
                    return updateInstanceAdminPgAssignmentMono.then(
                            permissionGroupRepository.updateById(organizationAdminPg.getId(), updateObj2));
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> permissionGroupRepository.evictAllPermissionGroupCachesForUser(
                        user.getEmail(), user.getOrganizationId()))
                .then(Mono.just(Boolean.TRUE));
    }

    public Mono<Boolean> removeInstanceAdmin(List<User> users) {

        // TODO : Replace cloud hosting check with a feature flag check for multi tenancy
        boolean cloudHosting = commonConfig.isCloudHosting();
        Mono<PermissionGroup> organizationAdminPgMono = Mono.just(new PermissionGroup());

        if (!cloudHosting) {
            organizationAdminPgMono = getDefaultOrganizationAdminPermissionGroup();
        }

        return Mono.zip(getInstanceAdminPermissionGroup(), organizationAdminPgMono)
                .flatMap(tuple -> {
                    PermissionGroup instanceAdminPg = tuple.getT1();
                    PermissionGroup organizationAdminPg = tuple.getT2();

                    if (instanceAdminPg.getAssignedToUserIds() == null) {
                        instanceAdminPg.setAssignedToUserIds(new HashSet<>());
                    }
                    Set<String> assignedToUserIds = new HashSet<>(instanceAdminPg.getAssignedToUserIds());
                    assignedToUserIds.removeAll(users.stream().map(User::getId).collect(Collectors.toList()));

                    BridgeUpdate updateObj = Bridge.update();
                    String path = PermissionGroup.Fields.assignedToUserIds;

                    updateObj.set(path, assignedToUserIds);
                    // Make Instance Admin is called before the first administrator is created.
                    Mono<Integer> updateInstanceAdminPgAssignmentMono =
                            permissionGroupRepository.updateById(instanceAdminPg.getId(), updateObj);

                    if (!hasLength(organizationAdminPg.getId())) {
                        return updateInstanceAdminPgAssignmentMono;
                    }

                    // Also unassign the users from the organization admin permission group
                    Set<String> organizationAdminAssignedToUserIds = new HashSet<>();
                    if (organizationAdminPg.getAssignedToUserIds() != null) {
                        organizationAdminAssignedToUserIds.addAll(organizationAdminPg.getAssignedToUserIds());
                    }
                    organizationAdminAssignedToUserIds.removeAll(
                            users.stream().map(User::getId).collect(Collectors.toList()));
                    BridgeUpdate updateObj2 = Bridge.update();
                    String path2 = PermissionGroup.Fields.assignedToUserIds;
                    updateObj2.set(path2, organizationAdminAssignedToUserIds);
                    return updateInstanceAdminPgAssignmentMono.then(
                            permissionGroupRepository.updateById(organizationAdminPg.getId(), updateObj2));
                })
                .then(Mono.just(users))
                .flatMapMany(Flux::fromIterable)
                .flatMap(user -> permissionGroupRepository.evictAllPermissionGroupCachesForUser(
                        user.getEmail(), user.getOrganizationId()))
                .then(Mono.just(Boolean.TRUE));
    }

    public Mono<PermissionGroup> getInstanceAdminPermissionGroup() {

        String instanceAdminPermissionGroupId = inMemoryCacheableRepositoryHelper.getInstanceAdminPermissionGroupId();
        if (hasLength(instanceAdminPermissionGroupId)) {
            return permissionGroupRepository.findById(instanceAdminPermissionGroupId);
        }

        return configRepository.findByName(INSTANCE_CONFIG).flatMap(instanceConfig -> {
            JSONObject config = instanceConfig.getConfig();
            String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
            return permissionGroupRepository
                    .findById(defaultPermissionGroup)
                    .doOnSuccess(permissionGroup -> inMemoryCacheableRepositoryHelper.setInstanceAdminPermissionGroupId(
                            permissionGroup.getId()));
        });
    }

    public Mono<PermissionGroup> getDefaultOrganizationAdminPermissionGroup() {
        return cacheableRepositoryHelper.getDefaultOrganizationId().flatMap(orgId -> {
            String permissionGroupId = inMemoryCacheableRepositoryHelper.getOrganizationAdminPermissionGroupId(orgId);
            if (hasLength(permissionGroupId)) {
                return permissionGroupRepository.findById(permissionGroupId);
            }
            return permissionGroupRepository
                    .findByDefaultDomainIdAndDefaultDomainType(orgId, Organization.class.getSimpleName())
                    .next()
                    .doOnSuccess(
                            permissionGroup -> inMemoryCacheableRepositoryHelper.setOrganizationAdminPermissionGroupId(
                                    orgId, permissionGroup.getId()));
        });
    }
}
