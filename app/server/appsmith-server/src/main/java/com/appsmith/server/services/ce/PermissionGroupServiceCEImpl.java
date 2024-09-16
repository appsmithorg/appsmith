package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.FieldName.PUBLIC_PERMISSION_GROUP;
import static java.lang.Boolean.TRUE;

@Slf4j
public class PermissionGroupServiceCEImpl
        extends BaseService<PermissionGroupRepository, PermissionGroupRepositoryCake, PermissionGroup, String>
        implements PermissionGroupServiceCE {

    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final UserRepositoryCake userRepository;
    private final PolicySolution policySolution;

    private final ConfigRepositoryCake configRepository;
    private final PermissionGroupPermission permissionGroupPermission;

    private PermissionGroup publicPermissionGroup = null;

    public PermissionGroupServiceCEImpl(
            Validator validator,
            PermissionGroupRepository repositoryDirect,
            PermissionGroupRepositoryCake repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserRepositoryCake userRepository,
            PolicySolution policySolution,
            ConfigRepositoryCake configRepository,
            PermissionGroupPermission permissionGroupPermission) {

        super(validator, repositoryDirect, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.policySolution = policySolution;
        this.configRepository = configRepository;
        this.permissionGroupPermission = permissionGroupPermission;
    }

    @Override
    public Mono<PermissionGroup> create(PermissionGroup permissionGroup) {
        return repository
                .save(permissionGroup)
                .map(pg -> {
                    Set<Permission> permissions = new HashSet<>(
                            Optional.ofNullable(pg.getPermissions()).orElse(Set.of()));
                    pg.setPermissions(permissions);
                    Map<String, Policy> policyMap =
                            policySolution.generatePolicyFromPermissionGroupForObject(pg, pg.getId());
                    policySolution.addPoliciesToExistingObject(policyMap, pg);
                    return pg;
                })
                .flatMap(pg -> repository.save(pg));
    }

    @Override
    public Flux<PermissionGroup> findAllByIds(Set<String> ids) {
        return repository.findAllByIdIn(ids);
    }

    @Override
    public Mono<PermissionGroup> save(PermissionGroup permissionGroup) {
        return repository.save(permissionGroup);
    }

    @Override
    public Mono<PermissionGroup> getById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Mono<Void> delete(String id) {

        return repository.findById(id).flatMap(permissionGroup -> {
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
    public Mono<Void> deleteWithoutPermission(String id) {
        return repository.findById(id).flatMap(permissionGroup -> {
            Mono<Void> returnMono = null;

            Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();

            if (assignedToUserIds == null || assignedToUserIds.isEmpty()) {
                returnMono = repository.deleteById(id);
            } else {
                returnMono = bulkUnassignUsersFromPermissionGroupsWithoutPermission(assignedToUserIds, Set.of(id))
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

    protected void ensureAssignedToUserIds(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToUserIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    protected void ensureAssignedToUserGroups(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToGroupIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsers(PermissionGroup pg, List<User> users) {
        ensureAssignedToUserIds(pg);
        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        pg.getAssignedToUserIds().addAll(userIds);
        pg.setAssignedToUserIds(new HashSet<>(pg.getAssignedToUserIds()));
        Mono<PermissionGroup> permissionGroupUpdateMono = repository
                .updateById(pg.getId(), pg, permissionGroupPermission.getAssignPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));

        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);

        return permissionGroupUpdateMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsers(String permissionGroupId, List<User> users) {
        return repository
                .findById(permissionGroupId, permissionGroupPermission.getAssignPermission())
                .flatMap(permissionGroup -> bulkAssignToUsers(permissionGroup, users));
    }

    @Override
    public Flux<PermissionGroup> getAllByAssignedToUserAndDefaultWorkspace(
            User user, Workspace defaultWorkspace, AclPermission permission) {
        return repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(
                user.getId(), defaultWorkspace.getId(), permission);
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
        pg.setAssignedToUserIds(new HashSet<>(pg.getAssignedToUserIds()));
        Mono<PermissionGroup> updatePermissionGroupMono =
                repository.updateById(pg.getId(), pg, permissionGroupPermission.getUnAssignPermission());
        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);
        return updatePermissionGroupMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUsers(String permissionGroupId, List<User> users) {
        return repository
                .findById(permissionGroupId, permissionGroupPermission.getUnAssignPermission())
                .flatMap(permissionGroup -> bulkUnassignFromUsers(permissionGroup, users));
    }

    Mono<PermissionGroup> bulkUnassignFromUserIds(PermissionGroup pg, List<String> userIds) {
        ensureAssignedToUserIds(pg);
        pg.getAssignedToUserIds().removeAll(userIds);
        Mono<PermissionGroup> updatePermissionGroupMono =
                repository.updateById(pg.getId(), pg, permissionGroupPermission.getUnAssignPermission());
        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);
        return updatePermissionGroupMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<Boolean> bulkUnassignUsersFromPermissionGroupsWithoutPermission(
            Set<String> userIds, Set<String> permissionGroupIds) {
        // TODO: This isn't bulk, it's updating each entry in turn.
        return repository
                .findAllById(permissionGroupIds)
                .flatMap(pg -> {
                    Set<String> assignedToUserIds = pg.getAssignedToUserIds();
                    assignedToUserIds.removeAll(userIds);

                    BridgeUpdate updateObj = Bridge.update();
                    String path = PermissionGroup.Fields.assignedToUserIds;

                    updateObj.set(path, assignedToUserIds);

                    Mono<Integer> updatePermissionGroupResultMono = repository.updateById(pg.getId(), updateObj);
                    Mono<Void> clearCacheForUsersMono = cleanPermissionGroupCacheForUsers(List.copyOf(userIds));

                    return updatePermissionGroupResultMono.then(clearCacheForUsersMono);
                })
                .then(Mono.just(TRUE));
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

        Mono<Map<String, String>> userMapMono =
                userRepository.findAllById(userIds).collectMap(user -> user.getId(), user -> user.getEmail());

        return tenantService
                .getDefaultTenantId()
                .zipWith(userMapMono)
                .flatMapMany(tuple -> {
                    String defaultTenantId = tuple.getT1();
                    Map<String, String> userMap = tuple.getT2();
                    return Flux.fromIterable(userIds).flatMap(userId -> {
                        String email = userMap.get(userId);
                        return repository
                                .evictAllPermissionGroupCachesForUser(email, defaultTenantId)
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

        return configRepository
                .findByName(PUBLIC_PERMISSION_GROUP)
                .map(configObj -> configObj.getConfig().getAsString(PERMISSION_GROUP_ID))
                .flatMap(permissionGroupId -> repository.findById(permissionGroupId))
                .doOnNext(permissionGroup -> publicPermissionGroup = permissionGroup);
    }

    @Override
    public Mono<String> getPublicPermissionGroupId() {
        return getPublicPermissionGroup().map(PermissionGroup::getId);
    }

    @Override
    public boolean isEntityAccessible(BaseDomain object, String permission, String permissionGroupId) {
        Set<Policy> policies = object.getPolicies() == null ? Set.of() : object.getPolicies();
        return policies.stream()
                .filter(policy -> policy.getPermission().equals(permission)
                        && policy.getPermissionGroups().contains(permissionGroupId))
                .findFirst()
                .isPresent();
    }

    protected Mono<PermissionGroup> sendEventUsersAssociatedToRole(
            PermissionGroup permissionGroup, List<String> usernames) {
        Mono<PermissionGroup> sendAssignedUsersToPermissionGroupEvent = Mono.just(permissionGroup);
        if (CollectionUtils.isNotEmpty(usernames)) {
            Map<String, Object> eventData = Map.of(FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS, usernames);
            Map<String, Object> extraPropsForCloudHostedInstance =
                    Map.of(FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS, usernames);
            Map<String, Object> analyticsProperties = Map.of(
                    FieldName.NUMBER_OF_ASSIGNED_USERS,
                    usernames.size(),
                    FieldName.EVENT_DATA,
                    eventData,
                    FieldName.CLOUD_HOSTED_EXTRA_PROPS,
                    extraPropsForCloudHostedInstance);
            sendAssignedUsersToPermissionGroupEvent = analyticsService.sendObjectEvent(
                    AnalyticsEvents.ASSIGNED_USERS_TO_PERMISSION_GROUP, permissionGroup, analyticsProperties);
        }
        return sendAssignedUsersToPermissionGroupEvent;
    }

    protected Mono<PermissionGroup> sendEventUserRemovedFromRole(
            PermissionGroup permissionGroup, List<String> usernames) {
        Mono<PermissionGroup> sendUnAssignedUsersToPermissionGroupEvent = Mono.just(permissionGroup);
        if (CollectionUtils.isNotEmpty(usernames)) {
            Map<String, Object> eventData = Map.of(FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS, usernames);
            Map<String, Object> extraPropsForCloudHostedInstance =
                    Map.of(FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS, usernames);
            Map<String, Object> analyticsProperties = Map.of(
                    FieldName.NUMBER_OF_UNASSIGNED_USERS,
                    usernames.size(),
                    FieldName.EVENT_DATA,
                    eventData,
                    FieldName.CLOUD_HOSTED_EXTRA_PROPS,
                    extraPropsForCloudHostedInstance);
            sendUnAssignedUsersToPermissionGroupEvent = analyticsService.sendObjectEvent(
                    AnalyticsEvents.UNASSIGNED_USERS_FROM_PERMISSION_GROUP, permissionGroup, analyticsProperties);
        }
        return sendUnAssignedUsersToPermissionGroupEvent;
    }

    @Override
    public Mono<PermissionGroup> assignToUserAndSendEvent(PermissionGroup permissionGroup, User user) {
        return bulkAssignToUserAndSendEvent(permissionGroup, List.of(user));
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUserAndSendEvent(PermissionGroup permissionGroup, List<User> users) {
        List<String> usernames = users.stream().map(User::getUsername).toList();
        return bulkAssignToUsers(permissionGroup, users)
                .flatMap(permissionGroup1 -> sendEventUsersAssociatedToRole(permissionGroup, usernames));
    }

    @Override
    public Mono<PermissionGroup> unAssignFromUserAndSendEvent(PermissionGroup permissionGroup, User user) {
        return bulkUnAssignFromUserAndSendEvent(permissionGroup, List.of(user));
    }

    @Override
    public Mono<PermissionGroup> bulkUnAssignFromUserAndSendEvent(PermissionGroup permissionGroup, List<User> users) {
        List<String> usernames = users.stream().map(User::getUsername).toList();
        return bulkUnassignFromUsers(permissionGroup, users)
                .flatMap(permissionGroup1 -> sendEventUserRemovedFromRole(permissionGroup, usernames));
    }

    @Override
    public Mono<Boolean> leaveExplicitlyAssignedSelfRole(String permissionGroupId) {
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        Mono<PermissionGroup> permissionGroupMono = repository.findById(permissionGroupId);

        return Mono.zip(currentUserMono, permissionGroupMono)
                .flatMap(tuple -> {
                    User currentUser = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();

                    String userId = currentUser.getId();

                    if (!StringUtils.hasLength(userId)) {
                        return Mono.error(new AppsmithException(AppsmithError.SESSION_BAD_STATE));
                    }

                    Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();

                    if (!assignedToUserIds.contains(userId)) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.USER_NOT_ASSIGNED_TO_ROLE,
                                currentUser.getUsername(),
                                permissionGroup.getName()));
                    }

                    assignedToUserIds.remove(userId);

                    BridgeUpdate updateObj = Bridge.update();
                    String path = PermissionGroup.Fields.assignedToUserIds;

                    updateObj.set(path, assignedToUserIds);

                    return repository
                            .updateById(permissionGroupId, updateObj)
                            .then(cleanPermissionGroupCacheForUsers(List.of(userId)));
                })
                .map(tuple -> TRUE);
    }

    @Override
    public Mono<Set<String>> getSessionUserPermissionGroupIds() {
        return sessionUserService.getCurrentUser().flatMap(usr -> repository.getAllPermissionGroupsIdsForUser(usr));
    }
}
