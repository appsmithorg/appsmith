package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PermissionGroupHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.mongodb.client.result.UpdateResult;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.TRUE;

@Service
public class PermissionGroupServiceCECompatibleImpl extends PermissionGroupServiceCEImpl
        implements PermissionGroupServiceCECompatible {

    private final PermissionGroupHelper permissionGroupHelper;

    public PermissionGroupServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PermissionGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserRepository userRepository,
            PolicySolution policySolution,
            ConfigRepository configRepository,
            PermissionGroupPermission permissionGroupPermission,
            PermissionGroupHelper permissionGroupHelper) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                sessionUserService,
                tenantService,
                userRepository,
                policySolution,
                configRepository,
                permissionGroupPermission);
        this.permissionGroupHelper = permissionGroupHelper;
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> getAll() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUsersIn(Set<String> userIds) {
        return repository.findAllByAssignedToUserIds(userIds, READ_PERMISSION_GROUPS);
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUserGroupsWithoutPermission(
            PermissionGroup permissionGroup, Set<String> userGroupIds) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUserGroups(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> getAllByAssignedToUserGroupAndDefaultWorkspace(
            UserGroup userGroup, Workspace defaultWorkspace, AclPermission aclPermission) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<RoleViewDTO> findConfigurableRoleById(String id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup permissionGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> bulkUnassignUserFromPermissionGroupsWithoutPermission(
            User user, Set<String> permissionGroupIds) {
        return repository
                .findAllById(permissionGroupIds)
                .flatMap(pg -> {
                    // Delete the User Management Role if user is being disassociated from it.
                    if (permissionGroupHelper.isUserManagementRole(pg)) {
                        return repository.delete(pg);
                    }

                    Set<String> assignedToUserIds = pg.getAssignedToUserIds();
                    assignedToUserIds.remove(user.getId());

                    Update updateObj = new Update();
                    String path = fieldName(QPermissionGroup.permissionGroup.assignedToUserIds);

                    updateObj.set(path, assignedToUserIds);
                    Mono<UpdateResult> updateAssignedToUserIdsForRoleMono =
                            repository.updateById(pg.getId(), updateObj);

                    // Trigger disassociation from role event, if the role is not Default Role For All Users.
                    Mono<Long> sendEventUserRemovedFromRoleIfRoleIsNotDefaultRoleMono = permissionGroupHelper
                            .getDefaultRoleForAllUserRoleId()
                            .flatMap(defaultRoleId -> {
                                if (!defaultRoleId.equals(pg.getId())) {
                                    return sendEventUserRemovedFromRole(pg, List.of(user.getEmail()))
                                            .thenReturn(1L);
                                }
                                return Mono.just(1L);
                            });
                    return updateAssignedToUserIdsForRoleMono.zipWhen(
                            updatedRole -> sendEventUserRemovedFromRoleIfRoleIsNotDefaultRoleMono);
                })
                .then(Mono.just(TRUE));
    }

    @Override
    public Mono<PermissionGroup> unassignFromUserGroup(PermissionGroup permissionGroup, UserGroup userGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> assignToUserGroup(PermissionGroup permissionGroup, UserGroup userGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserId(String userId) {
        return findAllByAssignedToUsersIn(Set.of(userId));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupId(String userGroupId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> bulkAssignToUsersWithoutPermission(PermissionGroup pg, List<User> users) {
        ensureAssignedToUserIds(pg);
        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        Update updateAssignedToUserIdsUpdate = new Update();
        updateAssignedToUserIdsUpdate
                .addToSet(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                .each(userIds.toArray());

        Mono<UpdateResult> permissionGroupUpdateMono = repository.updateById(pg.getId(), updateAssignedToUserIdsUpdate);

        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);

        return permissionGroupUpdateMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .thenReturn(TRUE);
    }

    @Override
    public Mono<Set<String>> getAllDirectlyAndIndirectlyAssignedUserIds(PermissionGroup permissionGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> getAllDefaultRolesForApplication(
            Application application, Optional<AclPermission> aclPermission) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsersAndGroups(
            PermissionGroup role, List<User> users, List<UserGroup> groups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> assignToUserGroupAndSendEvent(PermissionGroup permissionGroup, UserGroup userGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> unAssignFromUserGroupAndSendEvent(
            PermissionGroup permissionGroup, UserGroup userGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PermissionGroup> bulkUnAssignFromUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<String> getRoleNamesAssignedToUserIds(Set<String> userIds) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> bulkUnAssignUsersAndUserGroupsFromPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdsInWithoutPermission(Set<String> userIds) {
        return repository.findAllByAssignedToUserIds(userIds, Optional.empty(), Optional.empty());
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsInWithoutPermission(Set<String> groupIds) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdWithoutPermission(String userId) {
        return findAllByAssignedToUserIdsInWithoutPermission(Set.of(userId));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdWithoutPermission(String groupId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
