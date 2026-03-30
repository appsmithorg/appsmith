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
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.SessionUserService;
import io.micrometer.observation.ObservationRegistry;
import net.minidev.json.JSONObject;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    private final OrganizationRepository organizationRepository;
    private final SessionUserService sessionUserService;
    private final InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper;

    public UserUtilsCE(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            ObservationRegistry observationRegistry,
            CommonConfig commonConfig,
            OrganizationRepository organizationRepository,
            SessionUserService sessionUserService,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        this.configRepository = configRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.observationRegistry = observationRegistry;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.commonConfig = commonConfig;
        this.organizationRepository = organizationRepository;
        this.sessionUserService = sessionUserService;
        this.inMemoryCacheableRepositoryHelper = inMemoryCacheableRepositoryHelper;
    }

    public Mono<Boolean> isSuperUser(User user) {

        return organizationRepository
                .findByIdAsUser(user, user.getOrganizationId(), AclPermission.MANAGE_ORGANIZATION)
                .map(organization -> Boolean.TRUE)
                .switchIfEmpty(Mono.just(Boolean.FALSE))
                .name(CHECK_SUPER_USER_SPAN)
                .tap(Micrometer.observation(observationRegistry));
    }

    public Mono<Boolean> isCurrentUserSuperUser() {
        return sessionUserService.getCurrentUser().flatMap(this::isSuperUser);
    }

    public Mono<Boolean> makeInstanceAdministrator(List<User> users) {

        // TODO : Replace cloud hosting check with a feature flag check for multi tenancy
        boolean cloudHosting = commonConfig.getIsCloudHosting();
        Mono<PermissionGroup> organizationAdminPgMono = Mono.just(new PermissionGroup());

        if (!cloudHosting) {
            organizationAdminPgMono = getDefaultOrganizationAdminPermissionGroup();
        }

        Set<String> userIds = users.stream().map(User::getId).collect(Collectors.toSet());

        return Mono.zip(getInstanceAdminPermissionGroup(), organizationAdminPgMono)
                .flatMap(tuple -> {
                    PermissionGroup instanceAdminPg = tuple.getT1();
                    PermissionGroup organizationAdminPg = tuple.getT2();

                    BridgeUpdate updateObj = Bridge.update();
                    updateObj.addEachToSet(PermissionGroup.Fields.assignedToUserIds, userIds);
                    Mono<Integer> updateInstanceAdminPgAssignmentMono =
                            permissionGroupRepository.updateById(instanceAdminPg.getId(), updateObj);

                    if (!hasLength(organizationAdminPg.getId())) {
                        return updateInstanceAdminPgAssignmentMono;
                    }

                    BridgeUpdate updateObj2 = Bridge.update();
                    updateObj2.addEachToSet(PermissionGroup.Fields.assignedToUserIds, userIds);
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
        boolean cloudHosting = commonConfig.getIsCloudHosting();
        Mono<PermissionGroup> organizationAdminPgMono = Mono.just(new PermissionGroup());

        if (!cloudHosting) {
            organizationAdminPgMono = getDefaultOrganizationAdminPermissionGroup();
        }

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());

        return Mono.zip(getInstanceAdminPermissionGroup(), organizationAdminPgMono)
                .flatMap(tuple -> {
                    PermissionGroup instanceAdminPg = tuple.getT1();
                    PermissionGroup organizationAdminPg = tuple.getT2();

                    Mono<Integer> updateInstanceAdminPgAssignmentMono = Flux.fromIterable(userIds)
                            .flatMap(userId -> {
                                BridgeUpdate pullUpdate = Bridge.update();
                                pullUpdate.pull(PermissionGroup.Fields.assignedToUserIds, userId);
                                return permissionGroupRepository.updateById(instanceAdminPg.getId(), pullUpdate);
                            })
                            .then(Mono.just(1));

                    if (!hasLength(organizationAdminPg.getId())) {
                        return updateInstanceAdminPgAssignmentMono;
                    }

                    return updateInstanceAdminPgAssignmentMono.then(Flux.fromIterable(userIds)
                            .flatMap(userId -> {
                                BridgeUpdate pullUpdate = Bridge.update();
                                pullUpdate.pull(PermissionGroup.Fields.assignedToUserIds, userId);
                                return permissionGroupRepository.updateById(organizationAdminPg.getId(), pullUpdate);
                            })
                            .then(Mono.just(1)));
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
        return cacheableRepositoryHelper.getCurrentUserOrganizationId().flatMap(orgId -> {
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
