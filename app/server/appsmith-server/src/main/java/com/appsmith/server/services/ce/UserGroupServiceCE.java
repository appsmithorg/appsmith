package com.appsmith.server.services.ce;

import java.util.List;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserGroupServiceCE extends CrudService<UserGroup, String> {

    Flux<UserGroup> findAllByIds(Set<String> ids);

    Flux<UserGroup> getAllByIds(Set<String> ids, AclPermission permission);

    Flux<UserGroup> getAllByUserId(String userId, AclPermission permission);

    Mono<UserGroup> save(UserGroup userGroup);

    Mono<UserGroup> getById(String id, AclPermission permission);

    Flux<UserGroup> getDefaultUserGroups(String workspaceId);
    
    Mono<UserGroup> bulkAddUsers(UserGroup userGroup, List<User> users);

    Mono<UserGroup> addUser(UserGroup userGroup, User user);

    Mono<UserGroup> removeUser(UserGroup userGroup, User user);

}
