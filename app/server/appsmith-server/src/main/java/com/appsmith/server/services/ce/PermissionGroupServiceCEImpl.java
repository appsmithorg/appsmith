package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.FieldName.PUBLIC_PERMISSION_GROUP;
import static java.lang.Boolean.TRUE;


public class PermissionGroupServiceCEImpl extends BaseService<PermissionGroupRepository, PermissionGroup, String>
        implements PermissionGroupServiceCE {

    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final PolicyUtils policyUtils;

    private final ConfigRepository configRepository;

    private PermissionGroup publicPermissionGroup = null;

    public PermissionGroupServiceCEImpl(Scheduler scheduler,
                                        Validator validator,
                                        MongoConverter mongoConverter,
                                        ReactiveMongoTemplate reactiveMongoTemplate,
                                        PermissionGroupRepository repository,
                                        AnalyticsService analyticsService,
                                        SessionUserService sessionUserService,
                                        TenantService tenantService,
                                        UserRepository userRepository,
                                        PolicyUtils policyUtils, ConfigRepository configRepository) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.policyUtils = policyUtils;
        this.configRepository = configRepository;
    }

    @Override
    public Mono<PermissionGroup> create(PermissionGroup permissionGroup) {
        return super.create(permissionGroup)
                .map(pg -> {
                    Set<Permission> permissions = new HashSet<>(Optional.ofNullable(pg.getPermissions()).orElse(Set.of()));
                    // Permission to unassign self is always given
                    // so user can unassign himself from permission group
                    permissions.add(new Permission(pg.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS));
                    pg.setPermissions(permissions);
                    Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionGroupForObject(pg, pg.getId());
                    policyUtils.addPoliciesToExistingObject(policyMap, pg);
                    return pg;
                })
                .flatMap(pg -> repository.save(pg));
    }

    @Override
    public Flux<PermissionGroup> findAllByIds(Set<String> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public Mono<PermissionGroup> save(PermissionGroup permissionGroup) {
        return repository.save(permissionGroup);
    }

    @Override
    public Mono<PermissionGroup> getById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    public Mono<Void> delete(String id) {

        return repository.findById(id)
                .flatMap(permissionGroup -> {

                    Mono<Void> returnMono = null;

                    Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();

                    if (assignedToUserIds == null || assignedToUserIds.isEmpty()) {
                        returnMono = repository.deleteById(id);
                    } else {
                        returnMono = bulkUnassignFromUserIds(permissionGroup, List.copyOf(assignedToUserIds))
                                .then(repository.deleteById(id));
                    }

                    return returnMono;
                });
    }

    @Override
    public Mono<PermissionGroup> findById(String permissionGroupId) {
        return repository.findById(permissionGroupId);
    }

    public Mono<PermissionGroup> assignToUser(PermissionGroup permissionGroup, User user) {
        return bulkAssignToUsers(permissionGroup, List.of(user));
    }

    private void ensureAssignedToUserIds(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToUserIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsers(PermissionGroup pg, List<User> users) {
        ensureAssignedToUserIds(pg);
        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        pg.getAssignedToUserIds().addAll(userIds);
        Mono<PermissionGroup> permissionGroupUpdateMono = repository
                .updateById(pg.getId(), pg, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));

        return Mono.zip(
                        permissionGroupUpdateMono,
                        cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE)
                )
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsers(String permissionGroupId, List<User> users) {
        return repository.findById(permissionGroupId, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .flatMap(permissionGroup -> bulkAssignToUsers(permissionGroup, users));
    }

    @Override
    public Flux<PermissionGroup> getAllByAssignedToUserAndDefaultWorkspace(User user, Workspace defaultWorkspace, AclPermission permission) {
        return repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(user.getId(), defaultWorkspace.getId(), permission);
    }

    @Override
    public Mono<PermissionGroup> unassignFromUser(PermissionGroup permissionGroup, User user) {
        return bulkUnassignFromUsers(permissionGroup, List.of(user));
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUsers(PermissionGroup pg, List<User> users) {

        ensureAssignedToUserIds(pg);
        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        pg.getAssignedToUserIds().removeAll(userIds);
        return Mono.zip(
                        repository.updateById(pg.getId(), pg, AclPermission.UNASSIGN_PERMISSION_GROUPS),
                        cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE)
                )
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUsers(String permissionGroupId, List<User> users) {
        return repository.findById(permissionGroupId, AclPermission.UNASSIGN_PERMISSION_GROUPS)
                .flatMap(permissionGroup -> bulkUnassignFromUsers(permissionGroup, users));
    }

    Mono<PermissionGroup> bulkUnassignFromUserIds(PermissionGroup pg, List<String> userIds) {
        ensureAssignedToUserIds(pg);
        pg.getAssignedToUserIds().removeAll(userIds);
        return Mono.zip(
                        repository.updateById(pg.getId(), pg, AclPermission.UNASSIGN_PERMISSION_GROUPS),
                        cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE)
                )
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Flux<PermissionGroup> getByDefaultWorkspace(Workspace workspace, AclPermission permission) {
        return repository.findByDefaultWorkspaceId(workspace.getId(), permission);
    }

    @Override
    public Flux<PermissionGroup> getByDefaultWorkspaces(Set<String> workspaceIds, AclPermission permission) {
        return repository.findByDefaultWorkspaceIds(workspaceIds, permission);
    }

    @Override
    public Mono<Void> cleanPermissionGroupCacheForUsers(List<String> userIds) {

        Mono<Map<String, String>> userMapMono = userRepository.findAllById(userIds)
                .collectMap(user -> user.getId(), user -> user.getEmail());

        return tenantService.getDefaultTenantId()
                .zipWith(userMapMono)
                .flatMapMany(tuple -> {
                    String defaultTenantId = tuple.getT1();
                    Map<String, String> userMap = tuple.getT2();
                    return Flux.fromIterable(userIds)
                            .flatMap(userId -> {
                                String email = userMap.get(userId);
                                return repository.evictPermissionGroupsUser(email, defaultTenantId)
                                        .thenReturn(TRUE);
                            });
                })
                .then();
    }

    @Override
    public Mono<PermissionGroup> getPublicPermissionGroup() {

        if (publicPermissionGroup != null) {
            return Mono.just(publicPermissionGroup);
        }

        return configRepository.findByName(PUBLIC_PERMISSION_GROUP)
                .map(configObj -> configObj.getConfig().getAsString(PERMISSION_GROUP_ID))
                .flatMap(permissionGroupId -> repository.findById(permissionGroupId))
                .doOnNext(permissionGroup -> publicPermissionGroup = permissionGroup);
    }

    @Override
    public Mono<String> getPublicPermissionGroupId() {
        return getPublicPermissionGroup()
                .map(PermissionGroup::getId);
    }

    @Override
    public boolean isEntityAccessible(BaseDomain object, String permission, String permissionGroupId) {
        return object.getPolicies()
                .stream()
                .filter(policy -> policy.getPermission().equals(permission) &&
                        policy.getPermissionGroups().contains(permissionGroupId))
                .findFirst()
                .isPresent();
    }

}
