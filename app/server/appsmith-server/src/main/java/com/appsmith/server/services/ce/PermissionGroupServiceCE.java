package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface PermissionGroupServiceCE extends CrudService<PermissionGroup, String> {

    Flux<PermissionGroup> findAllByIds(Set<String> ids);

    Mono<PermissionGroup> bulkUnassignFromUsers(String permissionGroupId, List<User> users);

    Mono<Boolean> bulkUnassignUsersFromPermissionGroupsWithoutPermission(Set<String> userIds, Set<String> permissionGroupIds);

    Flux<PermissionGroup> getByDefaultWorkspace(Workspace workspace, AclPermission permission);

    Mono<PermissionGroup> save(PermissionGroup permissionGroup);

    Mono<PermissionGroup> getById(String id, AclPermission permission);

    Mono<PermissionGroup> assignToUser(PermissionGroup permissionGroup, User user);

    Mono<PermissionGroup> bulkAssignToUsers(PermissionGroup permissionGroup, List<User> users);

    Mono<PermissionGroup> bulkAssignToUsers(String permissionGroupId, List<User> users);

    Mono<PermissionGroup> unassignFromUser(PermissionGroup permissionGroup, User user);

    Flux<PermissionGroup> getAllByAssignedToUserAndDefaultWorkspace(User user, Workspace defaultWorkspace, AclPermission aclPermission);
    
    Mono<Void> delete(String id);

    Mono<Void> deleteWithoutPermission(String id);

    Mono<PermissionGroup> findById(String permissionGroupId);

    Mono<PermissionGroup> bulkUnassignFromUsers(PermissionGroup permissionGroup, List<User> users);

    Flux<PermissionGroup> getByDefaultWorkspaces(Set<String> workspaceIds, AclPermission permission);

    Mono<Void> cleanPermissionGroupCacheForUsers(List<String> userIds);

    Mono<PermissionGroup> getPublicPermissionGroup();

    Mono<String> getPublicPermissionGroupId();

    boolean isEntityAccessible(BaseDomain object, String permission, String publicPermissionGroupId);

    Mono<PermissionGroup> assignToUserAndSendEvent(PermissionGroup permissionGroup, User user);

    Mono<PermissionGroup> bulkAssignToUserAndSendEvent(PermissionGroup permissionGroup, List<User> users);

    Mono<PermissionGroup> unAssignFromUserAndSendEvent(PermissionGroup permissionGroup, User user);

    Mono<PermissionGroup> bulkUnAssignFromUserAndSendEvent(PermissionGroup permissionGroup, List<User> users);
}
