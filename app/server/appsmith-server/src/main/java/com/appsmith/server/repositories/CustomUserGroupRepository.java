package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomUserGroupRepository extends AppsmithRepository<UserGroup> {

    Flux<UserGroup> findAllByTenantId(String tenantId, AclPermission aclPermission);

    Flux<UserGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

    Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission aclPermission);

    Mono<UpdateResult> updateById(String id, Update updateObj);

    Mono<UserGroup> findByIdAndTenantIdithoutPermission(String id, String tenantId);

    Mono<Long> countAllReadableUserGroups();

    Flux<UserGroup> getAllByUsersIn(Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission);
}