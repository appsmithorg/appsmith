package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

public interface CustomUserGroupRepository extends AppsmithRepository<UserGroup> {

    Flux<UserGroup> findAllByTenantId(String tenantId, AclPermission aclPermission);

    Flux<UserGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

    Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission aclPermission);
}
