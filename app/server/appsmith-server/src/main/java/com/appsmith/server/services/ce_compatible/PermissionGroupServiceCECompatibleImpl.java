package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;
import java.util.Set;

@Service
public class PermissionGroupServiceCECompatibleImpl extends PermissionGroupServiceCEImpl
        implements PermissionGroupServiceCECompatible {

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
            PermissionGroupPermission permissionGroupPermission) {
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
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> getAll() {
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
    public Flux<PermissionGroup> findAllByAssignedToGroupId(String userGroupId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Set<String>> getAllDirectlyAndIndirectlyAssignedUserIds(PermissionGroup permissionGroup) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
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
    public Mono<Boolean> bulkUnAssignUsersAndUserGroupsFromPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> bulkAssignUsersAndUserGroupsToPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsInWithoutPermission(Set<String> groupIds) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdWithoutPermission(String groupId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
