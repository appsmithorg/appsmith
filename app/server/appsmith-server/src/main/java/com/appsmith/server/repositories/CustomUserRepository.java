package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCE;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomUserRepository extends CustomUserRepositoryCE {

    Flux<String> getAllUserEmail(String defaultTenantId);

    Flux<User> getAllUserObjectsWithEmail(
            String defaultTenantId,
            MultiValueMap<String, String> filters,
            int startIndex,
            int pageLimit,
            Optional<AclPermission> aclPermission);

    Mono<PagedDomain<User>> getUsersWithParamsPaginated(
            int count, int startIndex, List<String> filterEmails, Optional<AclPermission> aclPermission);

    Flux<User> getAllUsersByIsProvisioned(
            boolean isProvisioned, Optional<List<String>> includeFields, Optional<AclPermission> aclPermission);

    Flux<String> getUserEmailsByIdsAndTenantId(
            List<String> userIds, String tenantId, Optional<AclPermission> aclPermission);

    Mono<Long> countAllUsersByIsProvisioned(boolean isProvisioned, Optional<AclPermission> aclPermission);

    Mono<Boolean> updateUserPoliciesAndIsProvisionedWithoutPermission(
            String id, Boolean isProvisioned, Set<Policy> policies);

    Mono<Boolean> makeUserPristineBasedOnLoginSourceAndTenantId(LoginSource loginSource, String tenantId);

    Mono<Long> countAllUsers(MultiValueMap<String, String> queryParams, AclPermission aclPermission);
}
