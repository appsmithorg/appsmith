package com.appsmith.server.services.ce;

import java.util.List;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.services.CrudService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserGroupServiceCE extends CrudService<UserGroup, String> {

    Mono<UserGroup> getById(String id, AclPermission permission);

    Flux<UserGroup> getDefaultUserGroups(String workspaceId);
    
    Mono<UserGroup> bulkAddUsers(UserGroup userGroup, List<User> users);

}
