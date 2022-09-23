package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import reactor.core.publisher.Flux;

public interface CustomUserGroupRepository extends AppsmithRepository<UserGroup> {

    Flux<UserGroup> findAllByTenantId(String tenantId, AclPermission aclPermission);
}
