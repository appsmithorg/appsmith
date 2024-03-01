package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PagedDomain;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomUserGroupRepository extends AppsmithRepository<UserGroup> {

    Flux<UserGroup> findAllByTenantId(
            String tenantId, MultiValueMap<String, String> filters, AclPermission aclPermission);

    Flux<UserGroup> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

    Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission aclPermission);

    Flux<UserGroup> findAllByUsersIn(Set<String> userIds, AclPermission aclPermission);

    Mono<Void> updateById(String id, Update updateObj);

    Mono<UserGroup> findByIdAndTenantIdithoutPermission(String id, String tenantId);

    Mono<Long> countAllReadableUserGroups();

    Flux<UserGroup> getAllByUsersIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission);

    Mono<PagedDomain<UserGroup>> findUserGroupsWithParamsPaginated(
            int count,
            int startIndex,
            List<String> groupNames,
            List<String> filterUserIds,
            Optional<AclPermission> aclPermission);

    Mono<Long> countAllUserGroupsByIsProvisioned(boolean isProvisioned, Optional<AclPermission> aclPermission);

    Flux<UserGroup> getAllUserGroupsByIsProvisioned(
            boolean isProvisioned, Optional<List<String>> includeFields, Optional<AclPermission> aclPermission);

    Mono<Boolean> updateProvisionedUserGroupsPoliciesAndIsProvisionedWithoutPermission(
            Boolean isProvisioned, Set<Policy> policies);

    Flux<UserGroup> findAllByUsersIn(
            Set<String> userIds, Optional<AclPermission> aclPermission, Optional<List<String>> includeFields);
}
