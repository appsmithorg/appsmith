package com.appsmith.server.services.ce;

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

    Flux<PermissionGroup> getByDefaultWorkspace(Workspace workspace);

    Mono<PermissionGroup> save(PermissionGroup permissionGroup);

    Mono<PermissionGroup> getById(String id, AclPermission permission);

    Mono<PermissionGroup> assignToUser(PermissionGroup permissionGroup, User user);

    Mono<PermissionGroup> bulkAssignToUsers(PermissionGroup permissionGroup, List<User> users);

    Mono<PermissionGroup> unassignFromSelf(PermissionGroup permissionGroup);

    Mono<PermissionGroup> unassignFromUser(PermissionGroup permissionGroup, User user);

    Flux<PermissionGroup> getAllByAssignedToUserAndDefaultWorkspace(User user, Workspace defaultWorkspace, AclPermission aclPermission);
    
    Mono<Void> delete(String id);

    Mono<PermissionGroup> findById(String permissionGroupId);

    Mono<PermissionGroup> bulkUnassignFromUsers(PermissionGroup permissionGroup, List<User> users);
}
