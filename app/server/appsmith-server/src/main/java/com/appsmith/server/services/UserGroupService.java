package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import reactor.core.publisher.Mono;

public interface UserGroupService extends CrudService<UserGroup, String> {

    Mono<UserGroup> findById(String id, AclPermission permission);
    
}
